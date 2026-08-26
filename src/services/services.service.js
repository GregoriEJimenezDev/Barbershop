import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.config';
import { COLLECTIONS, APPOINTMENT_STATUS } from '../utils/constants';
import { toDateId } from '../utils/helpers';

/**
 * Services (Price Board) Service
 * Read operations are open to public. Write operations require admin.
 */

const servicesCollection = collection(db, COLLECTIONS.SERVICES);

/**
 * Subscribe to all services, sorted by name.
 * Used for the public price board and admin management.
 */
export const subscribeToServices = (callback, onError) => {
  const q = query(servicesCollection, orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const services = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(services);
    },
    onError
  );
};

/**
 * Get all services once (non-reactive)
 */
export const getAllServices = async () => {
  const q = query(servicesCollection, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get a single service by id
 */
export const getServiceById = async (serviceId) => {
  const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
  if (!serviceDoc.exists()) return null;
  return { id: serviceDoc.id, ...serviceDoc.data() };
};

/**
 * Create a new service (admin only)
 */
export const createService = async ({ name, price, durationMinutes, description = '' }) => {
  const docRef = await addDoc(servicesCollection, {
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

/**
 * Update a service (admin only)
 */
export const updateService = async (serviceId, updates) => {
  const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete a service (admin only - soft delete by setting active=false)
 */
export const deleteService = async (serviceId) => {
  const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  await deleteDoc(docRef);
};
