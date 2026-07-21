import { useEffect, useState } from 'react';
import './ScrollRail.css';

export default function ScrollRail() {
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isDesktop) return undefined;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <nav className="scroll-rail" aria-label="Page scroll progress">
      <div className="scroll-rail-track">
        <div className="scroll-rail-fill" style={{ height: `${progress * 100}%` }} />
      </div>
    </nav>
  );
}
