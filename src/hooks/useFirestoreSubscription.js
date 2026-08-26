import { useEffect, useState } from 'react';

/**
 * Generic hook to subscribe to a Firestore collection / document.
 * Manages loading / error states consistently.
 * Silently handles cases where Firebase isn't configured.
 */
export const useFirestoreSubscription = (subscribeFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);
    setError(null);
    try {
      const result = subscribeFn(
        (result) => {
          setData(result);
          setLoading(false);
        },
        (err) => {
          // Don't crash the UI on subscription errors
          setError(err);
          setLoading(false);
        }
      );
      if (typeof result === 'function') {
        unsubscribe = result;
      } else if (result && typeof result.unsubscribe === 'function') {
        unsubscribe = () => result.unsubscribe();
      }
    } catch (e) {
      setError(e);
      setLoading(false);
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
};
