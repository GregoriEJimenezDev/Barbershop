import { useEffect, useState } from 'react';

/**
 * Generic hook to subscribe to a Firestore collection / document.
 * Tolerates async subscribe functions (lazy Firebase loading).
 * Never crashes the UI on subscription errors.
 *
 * @typeparam T - The type of data returned from the subscribe function
 */
export const useFirestoreSubscription = <T>(
  subscribeFn: (onData: (result: T) => void, onError: (err: any) => void) => void | ((onData: (result: T) => void, onError: (err: any) => void) => void),
  deps: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | (() => void)[] = [];
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => subscribeFn(
        (result: T) => {
          if (!cancelled) {
            setData(result);
            setLoading(false);
          }
        },
        (err: any) => {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
        }
      ))
      .then((result: ((() => void) | (() => void)[]) | undefined) => {
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
      .catch((err: any) => {
        if (!cancelled) {
          setLoading(false);
        }
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