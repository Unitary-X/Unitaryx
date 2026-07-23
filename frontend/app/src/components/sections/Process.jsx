import { motion } from 'framer-motion';
import './Process.css';

const STEPS = [
  { n: '01', title: 'Discover', body: 'We map your goals, scope, and constraints into a clear brief and timeline.' },
  { n: '02', title: 'Design', body: 'Wireframes, system architecture, and the interaction model before any code.' },
  { n: '03', title: 'Build', body: 'Clean, production-grade implementation with regular checkpoints you can see.' },
  { n: '04', title: 'Optimize', body: 'Testing, performance tuning, and refinement against the delivery standard.' },
  { n: '05', title: 'Launch', body: 'A polished handover with full source code and post-delivery support.' },
];

export default function Process() {
  return (
    <section className="process-section" id="process">
      <div className="section-inner">
        <span className="eyebrow">How we work</span>
        <h2 className="section-title">A clear path from brief to launch.</h2>

        <ol className="process-steps">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              className="process-step"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <span className="process-step-n gradient-headline">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
