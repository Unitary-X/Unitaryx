import { motion } from 'framer-motion';
import ScrollPanel from '../layout/ScrollPanel';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import './Services.css';

const SERVICES = [
  {
    title: 'Web',
    description: 'Marketing sites, dashboards, and full-stack products built for speed and clarity.',
    rotate: -8,
    x: -60,
    y: -20,
  },
  {
    title: 'Software',
    description: 'Backend systems, APIs, and internal tools engineered to hold up under real load.',
    rotate: 4,
    x: 40,
    y: 30,
  },
  {
    title: 'Hardware',
    description: 'Embedded firmware and connected devices, from prototype board to production run.',
    rotate: -3,
    x: -20,
    y: 50,
  },
];

const cardVariants = {
  hidden: (custom) => ({
    opacity: 0,
    x: custom.x,
    y: custom.y,
    rotate: custom.rotate,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { type: 'spring', stiffness: 120, damping: 16 },
  },
};

export default function Services() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <ScrollPanel index={2} id="services">
      <div className="panel-inner services-inner">
        <span className="eyebrow">What we do</span>
        <h2 className="gradient-headline services-title">Three disciplines, one delivery.</h2>
        <div className="services-stack">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              className="services-card glass"
              style={{ '--stack-offset': i }}
              custom={service}
              initial={reduceMotion ? false : 'hidden'}
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
            >
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollPanel>
  );
}
