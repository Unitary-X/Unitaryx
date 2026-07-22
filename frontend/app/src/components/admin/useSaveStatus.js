import { useCallback, useRef, useState } from 'react';

// Tracks a subtle save lifecycle: idle -> saving -> saved (auto-resets) | error.
// Avoids toast spam (CLAUDE.md §8 admin micro-UX) — the UI shows a small checkmark.
export function useSaveStatus() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const timer = useRef(null);

  const run = useCallback(async (fn) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    setError('');
    try {
      const result = await fn();
      setStatus('saved');
      timer.current = setTimeout(() => setStatus('idle'), 1800);
      return result;
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Something went wrong');
      throw err;
    }
  }, []);

  return { status, error, run };
}
