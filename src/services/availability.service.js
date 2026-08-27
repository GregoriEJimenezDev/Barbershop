import { COLLECTIONS } from '../utils/constants';
import { db, isFirebaseConfigured } from './firebase.config';

const ensure = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado. Revisa tu archivo .env.');
  }
  return await import('firebase/firestore');
};

const toDateString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const availabilityId = (barberId, date) => {
  return `${barberId}_${toDateString(date)}`;
};

export const getAvailabilityByDate = async (barberId, date) => {
  try {
    const { doc, getDoc } = await ensure();
    const id = availabilityId(barberId, date);
    const snap = await getDoc(doc(db, COLLECTIONS.AVAILABILITY, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    return null;
  }
};

export const subscribeToAvailability = async (barberId, date, callback, onError) => {
  try {
    const { doc, onSnapshot } = await ensure();
    const id = availabilityId(barberId, date);
    const docRef = doc(db, COLLECTIONS.AVAILABILITY, id);
    return onSnapshot(
      docRef,
      (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      onError
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
};

export const subscribeToBarberAvailability = async (barberId, callback, onError) => {
  try {
    const { collection, query, where, onSnapshot } = await ensure();
    const colRef = collection(db, COLLECTIONS.AVAILABILITY);
    const q = query(colRef, where('barberId', '==', barberId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(items);
      },
      onError
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
};

export const setAvailability = async (barberId, date, { maxAppointments, timeSlots, blocked = false }) => {
  const { doc, setDoc, serverTimestamp } = await ensure();
  const dateStr = toDateString(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, `${barberId}_${dateStr}`);
  await setDoc(
    docRef,
    {
      barberId,
      date: dateStr,
      maxAppointments: Number(maxAppointments),
      timeSlots: timeSlots || [],
      blocked: Boolean(blocked),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return docRef.id;
};

export const blockDay = async (barberId, date) => {
  const dateStr = toDateString(date);
  const { doc, setDoc, serverTimestamp } = await ensure();
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, `${barberId}_${dateStr}`);
  await setDoc(
    docRef,
    {
      barberId,
      date: dateStr,
      blocked: true,
      maxAppointments: 0,
      timeSlots: [],
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const unblockDay = async (barberId, date) => {
  const dateStr = toDateString(date);
  const { doc, updateDoc, serverTimestamp } = await ensure();
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, `${barberId}_${dateStr}`);
  await updateDoc(docRef, {
    blocked: false,
    updatedAt: serverTimestamp()
  });
};

export const getAvailabilityInRange = async (barberId, startDate, endDate) => {
  try {
    const { collection, query, where, getDocs } = await ensure();
    const start = toDateString(startDate);
    const end = toDateString(endDate);
    const colRef = collection(db, COLLECTIONS.AVAILABILITY);
    const q = query(
      colRef,
      where('barberId', '==', barberId),
      where('date', '>=', start),
      where('date', '<=', end)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const subscribeToAllAvailability = async (callback, onError) => {
  try {
    const { collection, onSnapshot } = await ensure();
    const colRef = collection(db, COLLECTIONS.AVAILABILITY);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(items);
      },
      onError
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
};
