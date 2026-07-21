import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import './AmbientBackground.css';

const ORBS = [
  { color: '#9FB4FF', top: '5%', left: '10%', size: 520, duration: 24 },
  { color: '#E4CB98', top: '55%', left: '65%', size: 420, duration: 26 },
  { color: '#C9D6FF', top: '30%', left: '80%', size: 380, duration: 22 },
];

export default function AmbientBackground() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="ambient-background" aria-hidden="true">
      {ORBS.map((orb, i) => (
        <span
          key={i}
          className={reduceMotion ? 'ambient-orb ambient-orb--static' : 'ambient-orb'}
          style={{
            '--orb-color': orb.color,
            '--orb-top': orb.top,
            '--orb-left': orb.left,
            '--orb-size': `${orb.size}px`,
            '--orb-duration': `${orb.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
