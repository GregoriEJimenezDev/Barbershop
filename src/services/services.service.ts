import { COLLECTIONS } from '../utils/constants';
import { db } from './firebase.config';

/**
 * Service interface
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Subscribe to all services
 */
export const subscribeToServices = async (callback: (services: Service[]) => void, onError?: (err: Error) => void) => {
  try {
    const { collection, onSnapshot } = await import('firebase/firestore');
    const colRef = collection(db, COLLECTIONS.SERVICES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const services = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
        callback(services);
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