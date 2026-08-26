import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase.config';
import { COLLECTIONS } from '../utils/constants';
import { toDateId } from '../utils/helpers';

/**
 * Availability Service
 * Manages daily availability: time slots, max appointments, blocked days.
 * The document id is the date in YYYY-MM-DD format.
 */

const availabilityCollection = collection(db, COLLECTIONS.AVAILABILITY);

/**
 * Get availability for a specific date
 */
export const getAvailabilityByDate = async (date) => {
  const dateId = toDateId(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, dateId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Subscribe to availability for a specific date
 */
export const subscribeToAvailability = (date, callback, onError) => {
  const dateId = toDateId(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, dateId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    onError
  );
};

/**
 * Subscribe to all availability documents (admin calendar view)
 */
export const subscribeToAllAvailability = (callback, onError) => {
  return onSnapshot(
    availabilityCollection,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    onError
  );
};

/**
 * Set / upsert availability for a specific date (admin only)
 * @param {Date|string} date
 * @param {{maxAppointments:number, timeSlots:string[]}} data
 */
export const setAvailability = async (date, { maxAppointments, timeSlots, blocked = false }) => {
  const dateId = toDateId(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, dateId);
  await setDoc(
    docRef,
    {
      date: dateId,
      maxAppointments: Number(maxAppointments),
      timeSlots: timeSlots || [],
      blocked: Boolean(blocked),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
  return dateId;
};

/**
 * Block a full day (admin only)
 */
export const blockDay = async (date) => {
  const dateId = toDateId(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, dateId);
  await setDoc(
    docRef,
    {
      date: dateId,
      blocked: true,
      maxAppointments: 0,
      timeSlots: [],
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
};

/**
 * Unblock a day (admin only)
 */
export const unblockDay = async (date) => {
  const dateId = toDateId(date);
  const docRef = doc(db, COLLECTIONS.AVAILABILITY, dateId);
  await updateDoc(docRef, {
    blocked: false,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Get all availability within a date range
 */
export const getAvailabilityInRange = async (startDate, endDate) => {
  const start = toDateId(startDate);
  const end = toDateId(endDate);
  const q = query(
    availabilityCollection,
    where('date', '>=', start),
    where('date', '<=', end)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
