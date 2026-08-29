import { COLLECTIONS, APPOINTMENT_STATUS } from '../utils/constants';
import { db, functions, isFirebaseConfigured } from './firebase.config';
import { toDateId } from '../utils/helpers';

const ensureFirestore = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado. Revisa tu archivo .env.');
  }
  return await import('firebase/firestore');
};

const ensureFunctions = async () => {
  if (!isFirebaseConfigured || !functions) {
    throw new Error('Firebase no está configurado. Revisa tu archivo .env.');
  }
  return await import('firebase/functions');
};

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  basePrice: number;
  extraFee: number;
  totalPrice: number;
  date: string;
  time: string;
  isEmergency: boolean;
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CreateAppointmentData {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  isEmergency: boolean;
}

export const createAppointment = async ({ serviceId, barberId, date, time, isEmergency = false }: CreateAppointmentData) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'createAppointment');
  const result = await fn({
    serviceId,
    barberId,
    date: toDateId(date),
    time,
    isEmergency
  });
  return result.data;
};

export const rescheduleAppointment = async ({ appointmentId, newDate, newTime }: {
  appointmentId: string;
  newDate: Date | string;
  newTime: string;
}) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'rescheduleAppointment');
  const result = await fn({
    appointmentId,
    newDate: toDateId(newDate),
    newTime
  });
  return result.data;
};

export const updateAppointmentStatus = async ({ appointmentId, status }: {
  appointmentId: string;
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'reprogramada' | 'completada' | 'cancelada';
}) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'updateAppointmentStatus');
  const result = await fn({ appointmentId, status });
  return result.data;
};

export const cancelAppointment = async (appointmentId: string) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'cancelAppointment');
  const result = await fn({ appointmentId });
  return result.data;
};

export interface SubscribeOptions {
  callback: (items: Appointment[]) => void;
  onError?: (err: Error) => void;
}

export const subscribeToClientAppointments = async (clientId: string, callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(colRef, where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const subscribeToDateAppointments = async (date: Date | string, callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const dateId = toDateId(date);
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(colRef, where('date', '==', dateId), orderBy('time', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const subscribeToRangeAppointments = async (startDate: Date | string, endDate: Date | string, callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const start = toDateId(startDate);
    const end = toDateId(endDate);
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      colRef,
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'asc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const subscribeToBarberAppointments = async (barberId: string, callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      colRef,
      where('barberId', '==', barberId),
      orderBy('date', 'asc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const subscribeToBarberDateAppointments = async (barberId: string, date: Date | string, callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const dateId = toDateId(date);
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      colRef,
      where('barberId', '==', barberId),
      where('date', '==', dateId),
      orderBy('time', 'asc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const subscribeToEmergencyQueue = async (callback: (items: Appointment[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      colRef,
      where('isEmergency', '==', true),
      where('status', '==', APPOINTMENT_STATUS.PENDIENTE),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        callback(items);
      },
      (err: any) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }
};

export const getAppointmentsForDate = async (date: Date | string): Promise<Appointment[]> => {
  try {
    const { collection, query, where, getDocs } = await ensureFirestore();
    const dateId = toDateId(date);
    const colRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(colRef, where('date', '==', dateId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  } catch (e) {
    return [];
  }
};

export const getAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
  try {
    const { doc, getDoc } = await ensureFirestore();
    const snap = await getDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Appointment;
  } catch (e) {
    return null;
  }
};

export const EMERGENCY_FEE = 50;