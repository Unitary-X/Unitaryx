import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import './ScrollPanel.css';

/**
 * Pin-and-cover panel (CLAUDE.md §6). While the wrapper scrolls through the
 * viewport, `scroll-panel` stays sticky-pinned at the top — `scrollYProgress`
 * (0 at pin-start, 1 at pin-end) is handed to `children` when it's a render
 * function, so a section can drive real scroll-scrubbed motion instead of a
 * one-time viewport-triggered fade. `heightVh`/`mobileHeightVh` override the
 * default runway for panels that need more scroll room (e.g. Founders).
 */
export default function ScrollPanel({ index, id, className = '', heightVh, mobileHeightVh, children }) {
  const wrapperRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start start', 'end end'] });

  const wrapperStyle = { '--panel-index': index };
  if (heightVh) wrapperStyle['--panel-height-desktop'] = `${heightVh}vh`;
  if (mobileHeightVh) wrapperStyle['--panel-height-mobile'] = `${mobileHeightVh}vh`;

  return (
    <section ref={wrapperRef} className="scroll-panel-wrapper" style={wrapperStyle}>
      <motion.div
        id={id}
        className={`scroll-panel glass-panel ${className}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
      >
        {typeof children === 'function' ? children(scrollYProgress) : children}
      </motion.div>
    </section>
  );
}
