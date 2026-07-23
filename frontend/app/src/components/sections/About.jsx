import { motion } from 'framer-motion';
import './About.css';

const STATS = [
  { value: '10–15', label: 'Day typical turnaround' },
  { value: '3', label: 'Disciplines under one roof' },
  { value: '100%', label: 'Source code handed over' },
  { value: '7 days', label: 'Post-delivery support' },
];

const VALUES = [
  {
    title: 'One team, three disciplines',
    body: 'Web, software, and embedded hardware handled by the same people — no hand-offs, no finger-pointing between vendors.',
  },
  {
    title: 'Built to hold up',
    body: 'Production-grade code and hardware, structured for maintainability and growth rather than a quick demo.',
  },
  {
    title: 'Clear, direct communication',
    body: 'You talk to the people building your project. Scope, timelines, and trade-offs are stated plainly.',
  },
];

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="section-inner">
        <span className="eyebrow">About Unitary X</span>
        <h2 className="section-title">
          A studio that ships — from first idea to working product.
        </h2>
        <p className="about-lead">
          Unitary X is a freelance dev studio building web platforms, software systems, and embedded
          hardware. We take projects from concept to delivery with a focus on precision, performance,
          and outcomes you can measure — including academic and college projects.
        </p>

        <div className="about-stats">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="about-stat glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <span className="about-stat-value gradient-headline">{s.value}</span>
              <span className="about-stat-label">{s.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="about-values">
          {VALUES.map((v) => (
            <article className="about-value" key={v.title}>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
