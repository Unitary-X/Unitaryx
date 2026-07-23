import { useEffect, useState } from 'react';
import { getJSON } from '../lib/api';

export function useDashboard() {
  const [data, setData] = useState({ user: null, requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getJSON('/api/dashboard/requests')
      .then((res) => {
        if (!cancelled) setData({ user: res.user, requests: res.requests });
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

  return { ...data, loading, error };
}
