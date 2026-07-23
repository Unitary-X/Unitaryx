import { AnimatePresence, motion } from 'framer-motion';

export default function SaveBadge({ status, savedLabel = 'Saved', error }) {
  return (
    <AnimatePresence mode="wait">
      {status === 'saving' && (
        <motion.span
          key="saving"
          className="save-badge save-badge--saving"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Saving…
        </motion.span>
      )}
      {status === 'saved' && (
        <motion.span
          key="saved"
          className="save-badge save-badge--saved"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          ✓ {savedLabel}
        </motion.span>
      )}
      {status === 'error' && (
        <motion.span
          key="error"
          className="save-badge save-badge--error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {error || 'Error'}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
