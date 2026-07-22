import { motion } from 'framer-motion';
import { formatId, formatDate, formatValue, statusSlug } from './dashboardUtils';

export default function RequestCard({ request, index, onOpen }) {
  const { id, service, message, status, priority, value, deadline, created_at, is_updated } = request;
  const title = message.length > 72 ? `${message.slice(0, 72)}…` : message;

  return (
    <motion.article
      className="req-card glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => onOpen(request)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(request);
        }
      }}
      aria-label={`Request ${formatId(id)}, ${status}. View roadmap.`}
    >
      <div className="req-card-top">
        <span className="req-service">{service}</span>
        <span className={`req-status req-status--${statusSlug(status)}`}>
          {is_updated && <span className="req-updated">Updated</span>}
          {status}
        </span>
      </div>

      <h3 className="req-title">{title}</h3>

      <div className="req-meta">
        <span>#{formatId(id)}</span>
        <span>{formatDate(created_at)}</span>
        {deadline && <span>Due: {deadline}</span>}
      </div>

      <div className="req-footer">
        <span className={`req-prio req-prio--${(priority || '').toLowerCase()}`}>{priority}</span>
        <span className="req-value">{formatValue(value)}</span>
      </div>

      {is_updated && <span className="req-pulse" aria-hidden="true" />}
    </motion.article>
  );
}
