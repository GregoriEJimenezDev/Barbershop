/**
 * Cloud Functions - Business Logic Layer
 *
 * All critical business rules (slot limits, fees, status transitions,
 * barber creation, reviews) are enforced server-side here. NEVER trust the client.
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

const ROLES = {
  SUPERADMIN: 'superadmin',
  BARBER: 'barber',
  CLIENT: 'client'
};

// ============ HELPERS ============

const assert = (condition: unknown, code: string, message: string): void => {
  if (!condition) {
    throw new functions.https.HttpsError(code as any, message);
  }
};

const isValidTime = (time: string): boolean =>
  typeof time === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

const isValidDate = (date: string): boolean =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

const isValidEmail = (email: string): boolean =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string): boolean =>
  typeof password === 'string' && password.length >= 6;

const getUserRole = async (uid: string): Promise<string | null> => {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;
  return userDoc.data()?.role || null;
};

const isSuperAdmin = async (uid: string): Promise<boolean> => {
  const role = await getUserRole(uid);
  return role === ROLES.SUPERADMIN;
};

const isStaff = async (_uid: string): Promise<boolean> => {
  return false;
};
void isStaff;

const sendNotification = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> => {
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

const updateBarberRating = async (barberId: string): Promise<void> => {
  const reviewsSnap = await db
    .collection('reviews')
    .where('barberId', '==', barberId)
    .get();

  if (reviewsSnap.empty) {
    await db.collection('barbers').doc(barberId).update({
      averageRating: 0,
      reviewCount: 0
    });
    return;
  }

  const ratings = reviewsSnap.docs.map((d) => d.data().rating as number);
  const sum = ratings.reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;

  await db.collection('barbers').doc(barberId).update({
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: ratings.length
  });
};

// ============ BARBER MANAGEMENT ============

/**
 * Create a new barber account (superadmin only).
 * Creates Firebase Auth user, profile doc, and barber doc.
 */
export const createBarber = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isSuperAdmin(context.auth!.uid), 'permission-denied', 'Solo el dueño puede crear barberos.');

  const {
    email,
    password,
    name,
    phone = '',
    bio = '',
    specialties = [],
    photoURL = '',
    yearsOfExperience = 0
  } = data || {};

  assert(isValidEmail(email), 'invalid-argument', 'Email inválido.');
  assert(isValidPassword(password), 'invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
  assert(typeof name === 'string' && name.trim().length > 0, 'invalid-argument', 'Nombre requerido.');
  assert(Array.isArray(specialties), 'invalid-argument', 'specialties debe ser un arreglo.');
  assert(typeof yearsOfExperience === 'number' && yearsOfExperience >= 0, 'invalid-argument', 'Años de experiencia inválido.');

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
      photoURL: photoURL || undefined
    });
  } catch (e: any) {
    if (e.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Ya existe un usuario con ese email.');
    }
    throw new functions.https.HttpsError('internal', 'No se pudo crear el usuario.');
  }

  const uid = userRecord.uid;
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Create user profile doc
  await db.collection('users').doc(uid).set({
    uid,
    name,
    email,
    phone,
    photoURL,
    role: ROLES.BARBER,
    createdAt: now,
    updatedAt: now
  });

  // Create barber doc
  await db.collection('barbers').doc(uid).set({
    id: uid,
    name,
    email,
    phone,
    photoURL,
    bio,
    specialties,
    yearsOfExperience,
    averageRating: 0,
    reviewCount: 0,
    active: true,
    createdAt: now,
    updatedAt: now
  });

  // Set custom claims for security rules
  await auth.setCustomUserClaims(uid, { role: ROLES.BARBER });

  return {
    success: true,
    barber: { id: uid, name, email }
  };
});

/**
 * Update barber profile (superadmin or the barber themselves)
 */
export const updateBarber = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;
  const callerRole = await getUserRole(uid);

  const { barberId, updates } = data || {};
  assert(barberId, 'invalid-argument', 'barberId requerido.');
  assert(updates && typeof updates === 'object', 'invalid-argument', 'updates requerido.');

  // Authorization: superadmin can update anyone, barber can update only themselves
  const isSelf = uid === barberId;
  assert(
    callerRole === ROLES.SUPERADMIN || (callerRole === ROLES.BARBER && isSelf),
    'permission-denied',
    'No tienes permisos para editar este barbero.'
  );

  const allowedFields = ['name', 'phone', 'photoURL', 'bio', 'specialties', 'yearsOfExperience'];
  const sanitized: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      sanitized[key] = updates[key];
    }
  }
  sanitized.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // Update both users doc (for auth-related fields) and barbers doc
  const usersUpdate: Record<string, any> = { updatedAt: sanitized.updatedAt };
  if ('name' in sanitized) usersUpdate.name = sanitized.name;
  if ('phone' in sanitized) usersUpdate.phone = sanitized.phone;
  if ('photoURL' in sanitized) usersUpdate.photoURL = sanitized.photoURL;

  await Promise.all([
    db.collection('barbers').doc(barberId).update(sanitized),
    db.collection('users').doc(barberId).update(usersUpdate)
  ]);

  // Update Firebase Auth profile
  try {
    await auth.updateUser(barberId, {
      displayName: sanitized.name,
      phoneNumber: sanitized.phone || undefined,
      photoURL: sanitized.photoURL || undefined
    });
  } catch (e) {
    functions.logger.warn('Could not update auth profile', e);
  }

  return { success: true };
});

/**
 * Deactivate (soft delete) a barber (superadmin only)
 */
export const deactivateBarber = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isSuperAdmin(context.auth!.uid), 'permission-denied', 'Solo el dueño puede desactivar barberos.');

  const { barberId } = data || {};
  assert(barberId, 'invalid-argument', 'barberId requerido.');

  await db.collection('barbers').doc(barberId).update({
    active: false,
    deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

/**
 * Reactivate a barber (superadmin only)
 */
export const reactivateBarber = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isSuperAdmin(context.auth!.uid), 'permission-denied', 'Solo el dueño puede reactivar barberos.');

  const { barberId } = data || {};
  assert(barberId, 'invalid-argument', 'barberId requerido.');

  await db.collection('barbers').doc(barberId).update({
    active: true,
    deactivatedAt: admin.firestore.FieldValue.delete(),
    reactivatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

// ============ APPOINTMENT FUNCTIONS ============

/**
 * Create a new appointment
 * Each appointment is bound to a specific barberId.
 */
export const createAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;

  const { serviceId, barberId, date, time, isEmergency } = data || {};
  assert(serviceId && typeof serviceId === 'string', 'invalid-argument', 'serviceId requerido.');
  assert(barberId && typeof barberId === 'string', 'invalid-argument', 'barberId requerido.');
  assert(isValidDate(date), 'invalid-argument', 'Fecha inválida (YYYY-MM-DD).');
  assert(isValidTime(time), 'invalid-argument', 'Hora inválida (HH:mm).');
  assert(typeof isEmergency === 'boolean', 'invalid-argument', 'isEmergency debe ser booleano.');

  // 1. Verify service exists
  const serviceDoc = await db.collection('services').doc(serviceId).get();
  assert(serviceDoc.exists, 'not-found', 'El servicio no existe.');
  const service = serviceDoc.data()!;

  // 2. Verify barber exists and is active
  const barberDoc = await db.collection('barbers').doc(barberId).get();
  assert(barberDoc.exists, 'not-found', 'El barbero no existe.');
  const barber = barberDoc.data()!;
  assert(barber.active === true, 'failed-precondition', 'Este barbero no está disponible.');

  // 3. Get availability for this barber on this date
  // Doc id format: {barberId}_{YYYY-MM-DD}
  const availabilityId = `${barberId}_${date}`;
  const availDoc = await db.collection('availability').doc(availabilityId).get();
  assert(availDoc.exists, 'failed-precondition', 'El barbero no tiene disponibilidad configurada para este día.');
  const availability = availDoc.data()!;

  assert(!availability.blocked, 'failed-precondition', 'Este día está bloqueado para este barbero.');
  assert(availability.timeSlots?.includes(time), 'failed-precondition', 'La hora seleccionada no está disponible.');

  // 4. Count existing appointments for THIS barber on this day
  const existingSnap = await db
    .collection('appointments')
    .where('barberId', '==', barberId)
    .where('date', '==', date)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();

  const maxAppointments = Number(availability.maxAppointments) || 0;
  assert(existingSnap.size < maxAppointments, 'resource-exhausted', 'No quedan cupos con este barbero para este día.');

  // 5. Check the specific slot is not occupied for this barber
  const slotOccupied = existingSnap.docs.some((d) => d.data().time === time);
  assert(!slotOccupied, 'already-exists', 'Esta hora ya está ocupada con este barbero.');

  // 6. Create appointment
  const extraFee = isEmergency ? EMERGENCY_FEE : 0;
  const appointmentRef = db.collection('appointments').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const userDoc = await db.collection('users').doc(uid).get();
  const clientName = userDoc.data()?.name || 'Cliente';

  const appointmentData = {
    id: appointmentRef.id,
    clientId: uid,
    clientName,
    barberId,
    barberName: barber.name,
    barberPhotoURL: barber.photoURL || '',
    serviceId,
    serviceName: service.name,
    basePrice: Number(service.price) || 0,
    extraFee,
    totalPrice: Number(service.price) + extraFee,
    date,
    time,
    isEmergency,
    status: APPOINTMENT_STATUS.PENDIENTE,
    reviewed: false,
    createdAt: now,
    updatedAt: now
  };

  await appointmentRef.set(appointmentData);

  // 7. Notify the assigned barber (they have an account now)
  await sendNotification(
    barberId,
    isEmergency ? '⚡ Cita de emergencia' : 'Nueva cita',
    `${clientName} reservó ${time} - ${service.name}`,
    { appointmentId: appointmentRef.id, type: 'new_appointment' }
  );

  return { success: true, appointmentId: appointmentRef.id, appointment: appointmentData };
});

/**
 * Reschedule an appointment to a new date/time
 */
export const rescheduleAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;
  const callerRole = await getUserRole(uid);
  assert(
    callerRole === ROLES.SUPERADMIN || callerRole === ROLES.BARBER,
    'permission-denied',
    'No tienes permisos para reprogramar.'
  );

  const { appointmentId, newDate, newTime } = data || {};
  assert(appointmentId, 'invalid-argument', 'appointmentId requerido.');
  assert(isValidDate(newDate), 'invalid-argument', 'Fecha inválida.');
  assert(isValidTime(newTime), 'invalid-argument', 'Hora inválida.');

  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');
  const appt = apptDoc.data()!;

  // If barber, only reschedule their own appointments
  if (callerRole === ROLES.BARBER) {
    assert(appt.barberId === uid, 'permission-denied', 'Solo puedes reprogramar tus citas.');
  }

  const barberId = appt.barberId;
  const availabilityId = `${barberId}_${newDate}`;
  const availDoc = await db.collection('availability').doc(availabilityId).get();
  assert(availDoc.exists, 'failed-precondition', 'El barbero no tiene disponibilidad para el nuevo día.');
  const availability = availDoc.data()!;
  assert(!availability.blocked, 'failed-precondition', 'El nuevo día está bloqueado.');
  assert(availability.timeSlots?.includes(newTime), 'failed-precondition', 'La nueva hora no está configurada.');

  // Check slot not occupied (excluding current appointment)
  const slotSnap = await db
    .collection('appointments')
    .where('barberId', '==', barberId)
    .where('date', '==', newDate)
    .where('time', '==', newTime)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();
  const occupiedByOthers = slotSnap.docs.some((d) => d.id !== appointmentId);
  assert(!occupiedByOthers, 'already-exists', 'La nueva hora ya está ocupada.');

  // Count appointments on new day
  const newDaySnap = await db
    .collection('appointments')
    .where('barberId', '==', barberId)
    .where('date', '==', newDate)
    .where('status', 'in', [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA])
    .get();
  assert(newDaySnap.size <= (availability.maxAppointments || 0), 'resource-exhausted', 'No hay cupos en el nuevo día.');

  const previousDate = appt.date;
  const previousTime = appt.time;
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

  await sendNotification(
    appt.clientId,
    'Cita reprogramada',
    `Tu cita fue movida del ${previousDate} ${previousTime} al ${newDate} ${newTime}.`,
    { appointmentId, type: 'rescheduled' }
  );

  return { success: true };
});

/**
 * Update appointment status
 */
export const updateAppointmentStatus = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;
  const callerRole = await getUserRole(uid);

  const { appointmentId, status } = data || {};
  assert(appointmentId, 'invalid-argument', 'appointmentId requerido.');

  const validStatuses = Object.values(APPOINTMENT_STATUS);
  assert(validStatuses.includes(status), 'invalid-argument', 'Estado inválido.');

  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');
  const appt = apptDoc.data()!;

  if (status === APPOINTMENT_STATUS.CANCELADA) {
    assert(appt.clientId === uid, 'permission-denied', 'No puedes cancelar esta cita.');
    assert(
      [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA].includes(appt.status),
      'failed-precondition',
      'Esta cita no se puede cancelar en su estado actual.'
    );
  } else {
    // Only superadmin or the assigned barber can change status
    assert(
      callerRole === ROLES.SUPERADMIN || (callerRole === ROLES.BARBER && appt.barberId === uid),
      'permission-denied',
      'No tienes permisos para cambiar el estado.'
    );
  }

  await apptRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
  });

  if (status !== APPOINTMENT_STATUS.CANCELADA) {
    const messages: Record<string, string> = {
      aceptada: 'Tu cita fue aceptada.',
      rechazada: 'Tu cita fue rechazada.',
      completada: 'Tu cita fue completada. ¡Califica al barbero!',
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

export const cancelAppointment = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const { appointmentId } = data || {};
  // Re-implement logic to avoid TS recursive call signature issues
  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');
  const appt = apptDoc.data()!;
  assert(appt.clientId === context.auth!.uid, 'permission-denied', 'No puedes cancelar esta cita.');
  assert(
    [APPOINTMENT_STATUS.PENDIENTE, APPOINTMENT_STATUS.ACEPTADA].includes(appt.status),
    'failed-precondition',
    'Esta cita no se puede cancelar en su estado actual.'
  );
  await apptRef.update({
    status: APPOINTMENT_STATUS.CANCELADA,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    cancelledAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { success: true };
});

// ============ SERVICES ============

export const upsertService = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isSuperAdmin(context.auth!.uid), 'permission-denied', 'Solo el dueño.');

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
  }
  const ref = await db.collection('services').add({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, serviceId: ref.id };
});

export const deleteService = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  assert(await isSuperAdmin(context.auth!.uid), 'permission-denied', 'Solo el dueño.');
  const { serviceId } = data || {};
  assert(serviceId, 'invalid-argument', 'serviceId requerido.');
  await db.collection('services').doc(serviceId).delete();
  return { success: true };
});

// ============ AVAILABILITY ============

/**
 * Set availability for a barber on a specific date.
 * Doc id: {barberId}_{YYYY-MM-DD}
 */
export const setAvailability = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;
  const callerRole = await getUserRole(uid);

  const { barberId, date, maxAppointments, timeSlots, blocked } = data || {};
  assert(barberId, 'invalid-argument', 'barberId requerido.');
  assert(isValidDate(date), 'invalid-argument', 'Fecha inválida.');
  assert(typeof maxAppointments === 'number' && maxAppointments >= 0, 'invalid-argument', 'maxAppointments inválido.');
  assert(Array.isArray(timeSlots), 'invalid-argument', 'timeSlots debe ser un arreglo.');

  for (const t of timeSlots) {
    assert(isValidTime(t), 'invalid-argument', `Hora inválida: ${t}`);
  }

  // Authorization: superadmin OR the barber themselves
  assert(
    callerRole === ROLES.SUPERADMIN || (callerRole === ROLES.BARBER && uid === barberId),
    'permission-denied',
    'No puedes modificar la disponibilidad de otro barbero.'
  );

  const docId = `${barberId}_${date}`;
  await db.collection('availability').doc(docId).set(
    {
      barberId,
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

// ============ REVIEWS ============

/**
 * Create a review for a completed appointment
 * Only the client who had the appointment can review, only once,
 * and only when the appointment is marked as 'completada'.
 */
export const createReview = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');
  const uid = context.auth!.uid;

  const { appointmentId, rating, comment = '' } = data || {};
  assert(appointmentId, 'invalid-argument', 'appointmentId requerido.');
  assert(typeof rating === 'number' && rating >= 1 && rating <= 5, 'invalid-argument', 'Calificación debe ser 1-5.');

  const apptRef = db.collection('appointments').doc(appointmentId);
  const apptDoc = await apptRef.get();
  assert(apptDoc.exists, 'not-found', 'La cita no existe.');
  const appt = apptDoc.data()!;

  assert(appt.clientId === uid, 'permission-denied', 'Solo el cliente puede calificar su cita.');
  assert(appt.status === APPOINTMENT_STATUS.COMPLETADA, 'failed-precondition', 'Solo puedes calificar citas completadas.');
  assert(appt.reviewed !== true, 'failed-precondition', 'Esta cita ya fue calificada.');

  const reviewRef = db.collection('reviews').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const reviewData = {
    id: reviewRef.id,
    appointmentId,
    clientId: uid,
    clientName: appt.clientName,
    barberId: appt.barberId,
    serviceId: appt.serviceId,
    serviceName: appt.serviceName,
    rating,
    comment: typeof comment === 'string' ? comment.trim().substring(0, 500) : '',
    createdAt: now
  };

  await reviewRef.set(reviewData);
  await apptRef.update({ reviewed: true });

  await updateBarberRating(appt.barberId);

  return { success: true, reviewId: reviewRef.id };
});

// ============ USER ROLE MANAGEMENT ============

/**
 * Bootstrap or change user role (superadmin only after first one exists)
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  assert(context.auth?.uid, 'unauthenticated', 'Debes iniciar sesión.');

  // Bootstrap: if no superadmin exists, allow any authenticated user to bootstrap
  const superadminCount = (await db.collection('users').where('role', '==', ROLES.SUPERADMIN).get()).size;
  const callerRole = await getUserRole(context.auth!.uid);
  const isBootstrap = superadminCount === 0;

  assert(callerRole === ROLES.SUPERADMIN || isBootstrap, 'permission-denied', 'No autorizado.');

  const { uid, role } = data || {};
  assert(uid, 'invalid-argument', 'uid requerido.');
  assert(Object.values(ROLES).includes(role), 'invalid-argument', 'role inválido.');

  await db.collection('users').doc(uid).update({
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await auth.setCustomUserClaims(uid, { role });
  return { success: true };
});
