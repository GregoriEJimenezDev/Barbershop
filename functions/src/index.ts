/**
 * Cloud Functions - Business Logic Layer
 *
 * All critical business rules (slot limits, fees, status transitions)
 * are enforced server-side here. NEVER trust the client.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

const EMERGENCY_FEE = 50;
const APPOINTMENT_STATUS = {
  PENDIENTE: 'pendiente',
  ACEPTADA: 'aceptada',
  RECHAZADA: 'rechazada',
  REPROGRAMADA: 'reprogramada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

// ============ HELPER FUNCTIONS ============

const assert = (condition: boolean, code: string, message: string) => {
  if (!condition) {
    throw new functions.https.HttpsError(code as any, message);
  }
};

const isValidTime = (time: string): boolean =>
  typeof time === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

const isValidDate = (date: string): boolean =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

const getUserRole = async (uid: string): Promise<string | null> => {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;
  return userDoc.data()?.role || null;
};

const isAdmin = async (uid: string): Promise<boolean> => {
  const role = await getUserRole(uid);
  return role === 'admin';
};

const sendNotification = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data
      });
    }
    await db.collection('notifications').add({
      userId,
      title,
      body,
      read: false,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    functions.logger.error('Notification failed', e);
  }
};

// ============ APPOINTMENT FUNCTIONS ============

/**
 * Create a new appointment
 * Validates: authentication, role, service existence, date/time format,
 * availability for the date, slot not full, time slot is configured.
 */
export const createAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;

  const { serviceId, date, time, isEmergency } = data || {};
  assert(serviceId && typeof serviceId === 'string', 'invalid-argument', 'serviceId requerido.');
  assert(isValidDate(date), 'invalid-argument', 'Fecha inválida (YYYY-MM-DD).');
  assert(isValidTime(time), 'invalid-argument', 'Hora inválida (HH:mm).');
  assert(typeof isEmergency === 'boolean', 'invalid-argument', 'isEmergency debe ser booleano.');

  // 1. Get service
  const serviceDoc = await db.collection('services').doc(serviceId).get();
  assert(serviceDoc.exists, 'not-found', 'El servicio no existe.');
  const service = serviceDoc.data()!;

  // 2. Get availability for the date
  const availDoc = await db.collection('availability').doc(date).get();
  assert(availDoc.exists, 'failed-precondition', 'No hay disponibilidad configurada para este día.');
  const availability = availDoc.data()!;

  assert(!availability.blocked, 'failed-precondition', 'Este día está bloqueado.');
  assert(availability.timeSlots?.includes(time), 'failed-precondition', 'La hora seleccionada no está disponible.');

  // 3. Count existing appointments for the day that occupy a slot
  const existingSnap = await db
    .collection('appointments')
    .where('date', '==', date)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();

  const maxAppointments = Number(availability.maxAppointments) || 0;
  assert(existingSnap.size < maxAppointments, 'resource-exhausted', 'No quedan cupos para este día.');

  // 4. Check the specific slot is not already occupied
  const slotOccupied = existingSnap.docs.some((d) => {
    const appt = d.data();
    return appt.time === time;
  });
  assert(!slotOccupied, 'already-exists', 'Esta hora ya está ocupada.');

  // 5. Create appointment
  const extraFee = isEmergency ? EMERGENCY_FEE : 0;
  const appointmentRef = db.collection('appointments').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const appointmentData = {
    id: appointmentRef.id,
    clientId: uid,
    clientName: context.auth!.token.name || 'Cliente',
    serviceId,
    serviceName: service.name,
    basePrice: Number(service.price) || 0,
    extraFee,
    totalPrice: Number(service.price) + extraFee,
    date,
    time,
    isEmergency,
    status: APPOINTMENT_STATUS.PENDIENTE,
    createdAt: now,
    updatedAt: now
  };

  await appointmentRef.set(appointmentData);

  // 6. Notify admin
  const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
  const adminIds = adminsSnap.docs.map((d) => d.id);
  for (const adminId of adminIds) {
    await sendNotification(
      adminId,
      isEmergency ? 'Cita de emergencia' : 'Nueva cita',
      `${appointmentData.clientName} reservó ${time}${isEmergency ? ' (emergencia)' : ''}`,
      { appointmentId: appointmentRef.id, type: 'new_appointment' }
    );
  }

  return { success: true, appointmentId: appointmentRef.id, appointment: appointmentData };
});

/**
 * Reschedule an appointment to a new date/time (admin only)
 * Revalidates the new slot's availability.
 */
export const rescheduleAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;
  assert(await isAdmin(uid), 'permission-denied', 'Solo el administrador puede reprogramar.');

  const { appointmentId, newDate, newTime } = data || {};
  assert(appointmentId, 'invalid-argument', 'appointmentId requerido.');
  assert(isValidDate(newDate), 'invalid-argument', 'Fecha inválida.');
  assert(isValidTime(newTime), 'invalid-argument', 'Hora inválida.');

  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');

  // Validate new availability
  const availDoc = await db.collection('availability').doc(newDate).get();
  assert(availDoc.exists, 'failed-precondition', 'No hay disponibilidad para el nuevo día.');
  const availability = availDoc.data()!;
  assert(!availability.blocked, 'failed-precondition', 'El nuevo día está bloqueado.');
  assert(availability.timeSlots?.includes(newTime), 'failed-precondition', 'La nueva hora no está configurada.');

  // Check the new slot is not occupied
  const newSlotSnap = await db
    .collection('appointments')
    .where('date', '==', newDate)
    .where('time', '==', newTime)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();
  const isSameSlot = newSlotSnap.docs.some((d) => d.id === appointmentId);
  assert(isSameSlot || newSlotSnap.empty, 'already-exists', 'La nueva hora ya está ocupada.');

  // Count appointments on new day
  const newDaySnap = await db
    .collection('appointments')
    .where('date', '==', newDate)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();
  assert(newDaySnap.size <= (availability.maxAppointments || 0), 'resource-exhausted', 'No hay cupos en el nuevo día.');

  const previousDate = apptDoc.data()?.date;
  const previousTime = apptDoc.data()?.time;
  await apptRef.update({
    date: newDate,
    time: newTime,
    status: APPOINTMENT_STATUS.REPROGRAMADA,
    previousDate,
    previousTime,
    rescheduledBy: uid,
    rescheduledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Notify client
  await sendNotification(
    apptDoc.data()!.clientId,
    'Cita reprogramada',
    `Tu cita fue movida del ${previousDate} ${previousTime} al ${newDate} ${newTime}.`,
    { appointmentId, type: 'rescheduled' }
  );

  return { success: true };
});

/**
 * Update appointment status (admin only, except 'cancelada' which is allowed for client)
 * Valid transitions:
 *   pendiente -> aceptada | rechazada | reprogramada
 *   aceptada -> completada | reprogramada
 */
export const updateAppointmentStatus = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;

  const { appointmentId, status } = data || {};
  assert(appointmentId, 'invalid-argument', 'appointmentId requerido.');

  const validStatuses = Object.values(APPOINTMENT_STATUS);
  assert(validStatuses.includes(status), 'invalid-argument', 'Estado inválido.');

  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');

  const appt = apptDoc.data()!;

  // Client can only cancel their own appointment
  if (status === APPOINTMENT_STATUS.CANCELADA) {
    assert(appt.clientId === uid, 'permission-denied', 'No puedes cancelar esta cita.');
    assert(
      [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA].includes(appt.status),
      'failed-precondition',
      'Esta cita no se puede cancelar en su estado actual.'
    );
  } else {
    assert(await isAdmin(uid), 'permission-denied', 'Solo el administrador puede cambiar el estado.');
  }

  await apptRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
  });

  // Notify client about status changes
  if (status !== APPOINTMENT_STATUS.CANCELADA) {
    const messages: Record<string, string> = {
      aceptada: 'Tu cita fue aceptada.',
      rechazada: 'Tu cita fue rechazada.',
      completada: 'Tu cita fue marcada como completada.',
      reprogramada: 'Tu cita fue reprogramada.'
    };
    await sendNotification(
      appt.clientId,
      'Estado de tu cita',
      messages[status] || 'Tu cita fue actualizada.',
      { appointmentId, type: 'status_change', status }
    );
  }

  return { success: true };
});

/**
 * Backward-compatible cancel helper
 */
export const cancelAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const { appointmentId } = data || {};
  return await updateAppointmentStatus(
    { appointmentId, status: APPOINTMENT_STATUS.CANCELADA },
    context
  );
});

// ============ ADMIN HELPER FUNCTIONS ============

/**
 * Set / update a service (admin only)
 */
export const upsertService = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isAdmin(context.auth!.uid), 'permission-denied', 'Solo administradores.');

  const { serviceId, name, price, durationMinutes, description, active } = data || {};
  assert(typeof name === 'string' && name.length > 0, 'invalid-argument', 'Nombre requerido.');
  assert(typeof price === 'number' && price > 0, 'invalid-argument', 'Precio inválido.');
  assert(typeof durationMinutes === 'number' && durationMinutes > 0, 'invalid-argument', 'Duración inválida.');

  const payload = {
    name,
    price,
    durationMinutes,
    description: description || '',
    active: active !== false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (serviceId) {
    await db.collection('services').doc(serviceId).update(payload);
    return { success: true, serviceId };
  } else {
    const ref = await db.collection('services').add({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, serviceId: ref.id };
  }
});

/**
 * Delete a service (admin only)
 */
export const deleteService = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isAdmin(context.auth!.uid), 'permission-denied', 'Solo administradores.');

  const { serviceId } = data || {};
  assert(serviceId, 'invalid-argument', 'serviceId requerido.');
  await db.collection('services').doc(serviceId).delete();
  return { success: true };
});

/**
 * Set / update availability for a date (admin only)
 */
export const setAvailability = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isAdmin(context.auth!.uid), 'permission-denied', 'Solo administradores.');

  const { date, maxAppointments, timeSlots, blocked } = data || {};
  assert(isValidDate(date), 'invalid-argument', 'Fecha inválida.');
  assert(typeof maxAppointments === 'number' && maxAppointments >= 0, 'invalid-argument', 'maxAppointments inválido.');
  assert(Array.isArray(timeSlots), 'invalid-argument', 'timeSlots debe ser un arreglo.');

  for (const t of timeSlots) {
    assert(isValidTime(t), 'invalid-argument', `Hora inválida: ${t}`);
  }

  await db.collection('availability').doc(date).set(
    {
      date,
      maxAppointments,
      timeSlots,
      blocked: Boolean(blocked),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true };
});

/**
 * Bootstrap: promote a user to admin (only callable by an existing admin).
 * Used once during initial setup.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const callerRole = await getUserRole(context.auth!.uid);
  const isBootstrap = !(await db.collection('users').where('role', '==', 'admin').get()).size;
  assert(callerRole === 'admin' || isBootstrap, 'permission-denied', 'No autorizado.');

  const { uid, role } = data || {};
  assert(uid, 'invalid-argument', 'uid requerido.');
  assert(['admin', 'client'].includes(role), 'invalid-argument', 'role inválido.');

  await db.collection('users').doc(uid).update({ role, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await auth.setCustomUserClaims(uid, { role });
  return { success: true };
});
