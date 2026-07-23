import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './Faq.css';

const FAQS = [
  {
    q: 'How fast can we start?',
    a: 'Usually within 24 hours of confirming scope and timeline. We move quickly once the brief is clear.',
  },
  {
    q: 'Do you handle web, software, and hardware?',
    a: 'Yes — all three, with the same team. That means no coordination overhead between separate vendors on connected projects.',
  },
  {
    q: 'Are revisions included?',
    a: 'Yes. Revision rounds are part of the engagement so the final result aligns with your objectives.',
  },
  {
    q: 'Do I get the source code?',
    a: 'Always. Full source is handed over on delivery — nothing is locked in.',
  },
  {
    q: 'Do you take academic or college projects?',
    a: 'Yes — B.Tech, MCA, Diploma and similar academic projects are welcome, delivered to the same standard.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'UPI, bank transfer, and other common digital payment methods.',
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button type="button" className="faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{item.q}</span>
        <span className="faq-icon" aria-hidden="true">
          {open ? '–' : '+'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <p>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="faq-section" id="faq">
      <div className="section-inner faq-inner">
        <div className="faq-head">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title">Common questions before we kick off.</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
