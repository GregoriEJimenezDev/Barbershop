import { COLLECTIONS } from '../utils/constants';
import { db } from './firebase.config';

/**
 * Availability interface
 */
export interface Availability {
  id: string;
  date: string;
  maxAppointments: number;
  timeSlots: string[];
  blocked: boolean;
  barberId?: string;
}

/**
 * Subscribe to all availability
 */
export const subscribeToAllAvailability = async (callback: (availability: Availability[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, onSnapshot } = await import('firebase/firestore');
    const colRef = collection(db, COLLECTIONS.AVAILABILITY);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const availability = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Availability));
        callback(availability);
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

/**
 * Subscribe to a specific date availability
 */
export const subscribeToDateAvailability = async (date: string, callback: (availability: Availability[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, query, where, onSnapshot } = await import('firebase/firestore');
    const colRef = collection(db, COLLECTIONS.AVAILABILITY);
    const q = query(colRef, where('date', '==', date));
    return onSnapshot(
      q,
      (snapshot) => {
        const availability = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Availability));
        callback(availability);
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