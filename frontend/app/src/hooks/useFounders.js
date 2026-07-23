import { useEffect, useState } from 'react';
import { getJSON } from '../lib/api';

export function useFounders() {
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getJSON('/api/founders')
      .then((data) => {
        if (!cancelled) setFounders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { founders, loading, error };
}
