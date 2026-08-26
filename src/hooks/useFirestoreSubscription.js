import { useEffect, useState } from 'react';

/**
 * Generic hook to subscribe to a Firestore collection / document.
 * Tolerates async subscribe functions (lazy Firebase loading).
 * Never crashes the UI on subscription errors.
 */
export const useFirestoreSubscription = (subscribeFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => subscribeFn(
        (result) => {
          if (!cancelled) {
            setData(result);
            setLoading(false);
          }
        },
        (err) => {
          if (!cancelled) {
            setError(err);
            setLoading(false);
          }
        }
      ))
      .then((result) => {
        if (cancelled) {
          if (typeof result === 'function') result();
          return;
        }
        if (typeof result === 'function') {
          unsubscribe = result;
        } else if (result && typeof result.unsubscribe === 'function') {
          unsubscribe = () => result.unsubscribe();
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // Safety: ensure loading flips off
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
};
