import { useCallback, useState } from 'react';
import { getErrorMessage } from '../utils/helpers';

/**
 * Generic async action hook.
 * Wraps an async function with loading/error states.
 */
export const useAsyncAction = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const run = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (e) {
        setError(e);
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
