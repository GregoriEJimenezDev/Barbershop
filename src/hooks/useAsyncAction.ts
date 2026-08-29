import { useCallback, useState } from 'react';
import { getErrorMessage } from '../utils/helpers';

/**
 * Generic async action hook.
 * Wraps an async function with loading/error states.
 *
 * @typeparam T - The type of the return value from the async function
 */
export const useAsyncAction = <T>(asyncFn: (...args: any[]) => Promise<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return { run, loading, error, data, reset, errorMessage: error ? getErrorMessage(error) : null };
};