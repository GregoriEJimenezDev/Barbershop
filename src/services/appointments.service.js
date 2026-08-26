import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, functions } from './firebase.config';
import {
  COLLECTIONS,
  APPOINTMENT_STATUS,
  CLOUD_FUNCTIONS,
  EMERGENCY_FEE
} from '../utils/constants';
import { toDateId } from '../utils/helpers';

/**
 * Appointments Service
 * All write operations go through Cloud Functions to enforce business rules:
 * - Maximum appointments per day
 * - Emergency fee calculation
 * - Status transitions
 */

const appointmentsCollection = collection(db, COLLECTIONS.APPOINTMENTS);

/**
 * Create a new appointment via Cloud Function.
 * The Cloud Function validates slot availability and emergency fee.
 */
export const createAppointment = async ({ serviceId, date, time, isEmergency = false }) => {
  const fn = httpsCallable(functions, CLOUD_FUNCTIONS.CREATE_APPOINTMENT);
  const result = await fn({
    serviceId,
    date: toDateId(date),
    time,
    isEmergency
  });
  return result.data;
};

/**
 * Reschedule an existing appointment (admin)
 */
export const rescheduleAppointment = async ({ appointmentId, newDate, newTime }) => {
  const fn = httpsCallable(functions, CLOUD_FUNCTIONS.RESCHEDULE_APPOINTMENT);
  const result = await fn({
    appointmentId,
    newDate: toDateId(newDate),
    newTime
  });
  return result.data;
};

/**
 * Update appointment status (admin: accept/reject/complete, client: cancel)
 */
export const updateAppointmentStatus = async ({ appointmentId, status }) => {
  const fn = httpsCallable(functions, CLOUD_FUNCTIONS.UPDATE_APPOINTMENT_STATUS);
  const result = await fn({ appointmentId, status });
  return result.data;
};

/**
 * Cancel an appointment (client self-cancel)
 */
export const cancelAppointment = async (appointmentId) => {
  const fn = httpsCallable(functions, CLOUD_FUNCTIONS.CANCEL_APPOINTMENT);
  const result = await fn({ appointmentId });
  return result.data;
};

/**
 * Subscribe to a client's appointments (real-time)
 */
export const subscribeToClientAppointments = (clientId, callback, onError) => {
  const q = query(
    appointmentsCollection,
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    onError
  );
};

/**
 * Subscribe to ALL appointments for a specific date (admin dashboard)
 */
export const subscribeToDateAppointments = (date, callback, onError) => {
  const dateId = toDateId(date);
  const q = query(
    appointmentsCollection,
    where('date', '==', dateId),
    orderBy('time', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    onError
  );
};

/**
 * Subscribe to all appointments within a date range (admin weekly view)
 */
export const subscribeToRangeAppointments = (startDate, endDate, callback, onError) => {
  const start = toDateId(startDate);
  const end = toDateId(endDate);
  const q = query(
    appointmentsCollection,
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    onError
  );
};

/**
 * Subscribe to all emergency appointments pending approval
 */
export const subscribeToEmergencyQueue = (callback, onError) => {
  const q = query(
    appointmentsCollection,
    where('isEmergency', '==', true),
    where('status', '==', APPOINTMENT_STATUS.PENDIENTE),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    onError
  );
};

/**
 * Get appointments for a specific date and time slot (used for slot calculation)
 */
export const getAppointmentsForDate = async (date) => {
  const dateId = toDateId(date);
  const q = query(appointmentsCollection, where('date', '==', dateId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get a single appointment by id
 */
export const getAppointmentById = async (appointmentId) => {
  const snap = await getDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export { EMERGENCY_FEE };
