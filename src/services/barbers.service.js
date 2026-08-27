import { COLLECTIONS } from '../utils/constants';
import { db, functions, isFirebaseConfigured } from './firebase.config';

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

/**
 * Subscribe to all active barbers (public, for clients to see options)
 */
export const subscribeToBarbers = async (callback, onError) => {
  try {
    const { collection, query, where, orderBy, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.BARBERS);
    const q = query(colRef, where('active', '==', true), orderBy('averageRating', 'desc'));
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

/**
 * Subscribe to ALL barbers (including inactive) - superadmin only
 */
export const subscribeToAllBarbers = async (callback, onError) => {
  try {
    const { collection, query, orderBy, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.BARBERS);
    const q = query(colRef, orderBy('createdAt', 'desc'));
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

/**
 * Get a single barber by id
 */
export const getBarberById = async (barberId) => {
  try {
    const { doc, getDoc } = await ensureFirestore();
    const snap = await getDoc(doc(db, COLLECTIONS.BARBERS, barberId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    return null;
  }
};

/**
 * Subscribe to a single barber (real-time)
 */
export const subscribeToBarber = async (barberId, callback, onError) => {
  try {
    const { doc, onSnapshot } = await ensureFirestore();
    return onSnapshot(
      doc(db, COLLECTIONS.BARBERS, barberId),
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

/**
 * Create a barber (superadmin only) - via Cloud Function
 */
export const createBarber = async ({ email, password, name, phone, bio, specialties, yearsOfExperience, photoURL }) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'createBarber');
  const result = await fn({
    email,
    password,
    name,
    phone,
    bio,
    specialties,
    yearsOfExperience,
    photoURL
  });
  return result.data;
};

/**
 * Update a barber profile (superadmin or self)
 */
export const updateBarberProfile = async ({ barberId, updates }) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'updateBarber');
  const result = await fn({ barberId, updates });
  return result.data;
};

/**
 * Deactivate a barber (superadmin only)
 */
export const deactivateBarber = async (barberId) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'deactivateBarber');
  const result = await fn({ barberId });
  return result.data;
};

/**
 * Reactivate a barber (superadmin only)
 */
export const reactivateBarber = async (barberId) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'reactivateBarber');
  const result = await fn({ barberId });
  return result.data;
};

// ============ REVIEWS ============

/**
 * Subscribe to reviews for a specific barber (public)
 */
export const subscribeToBarberReviews = async (barberId, callback, onError) => {
  try {
    const { collection, query, where, orderBy, limit, onSnapshot } = await ensureFirestore();
    const colRef = collection(db, COLLECTIONS.REVIEWS);
    const q = query(
      colRef,
      where('barberId', '==', barberId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
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

/**
 * Create a review for a completed appointment (client only)
 */
export const createReview = async ({ appointmentId, rating, comment }) => {
  const { httpsCallable } = await ensureFunctions();
  const fn = httpsCallable(functions, 'createReview');
  const result = await fn({ appointmentId, rating, comment });
  return result.data;
};
