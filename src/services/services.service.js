import { COLLECTIONS } from '../utils/constants';
import { db, isFirebaseConfigured } from './firebase.config';

const ensure = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado. Revisa tu archivo .env.');
  }
  return await import('firebase/firestore');
};

export const subscribeToServices = async (callback, onError) => {
  try {
    const { collection, query, orderBy, onSnapshot } = await ensure();
    const colRef = collection(db, COLLECTIONS.SERVICES);
    const q = query(colRef, orderBy('name', 'asc'));
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

export const getAllServices = async () => {
  try {
    const { collection, query, orderBy, getDocs } = await ensure();
    const colRef = collection(db, COLLECTIONS.SERVICES);
    const q = query(colRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getServiceById = async (serviceId) => {
  try {
    const { doc, getDoc } = await ensure();
    const snap = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    return null;
  }
};

export const createService = async ({ name, price, durationMinutes, description = '' }) => {
  const { collection, addDoc, serverTimestamp } = await ensure();
  const colRef = collection(db, COLLECTIONS.SERVICES);
  const docRef = await addDoc(colRef, {
    name,
    price: Number(price),
    durationMinutes: Number(durationMinutes),
    description,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateService = async (serviceId, updates) => {
  const { doc, updateDoc, serverTimestamp } = await ensure();
  const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteService = async (serviceId) => {
  const { doc, deleteDoc } = await ensure();
  const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  await deleteDoc(docRef);
};
