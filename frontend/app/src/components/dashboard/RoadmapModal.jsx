import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ROADMAP_STEPS, activeStepIndex, formatId } from './dashboardUtils';

export default function RoadmapModal({ request, onClose }) {
  const active = activeStepIndex(request.status);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="roadmap-overlay" onClick={onClose} role="presentation">
      <motion.div
        className="roadmap-modal glass-strong"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Roadmap for request ${formatId(request.id)}`}
      >
        <div className="roadmap-head">
          <div>
            <p className="roadmap-eyebrow">Request #{formatId(request.id)}</p>
            <h3>Project roadmap</h3>
          </div>
          <button type="button" className="roadmap-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <ol className="roadmap-steps">
          {ROADMAP_STEPS.map((step, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'todo';
            return (
              <li key={step.key} className={`roadmap-step roadmap-step--${state}`}>
                <span className="roadmap-node" aria-hidden="true">
                  {i < active ? '✓' : i + 1}
                </span>
                <span className="roadmap-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <p className="roadmap-note">
          Current status: <strong>{request.status}</strong>. Steps update automatically as your
          project progresses.
        </p>
      </motion.div>
    </div>
  );
}
