import { motion } from 'framer-motion';
import './ScrollPanel.css';

export default function ScrollPanel({ index, id, className = '', children }) {
  return (
    <section className="scroll-panel-wrapper" style={{ '--panel-index': index }}>
      <motion.div
        id={id}
        className={`scroll-panel glass-panel ${className}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
      >
        {children}
      </motion.div>
    </section>
  );
}
