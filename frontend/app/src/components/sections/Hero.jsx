import { motion, useTransform } from 'framer-motion';
import KineticText from '../common/KineticText';
import MagneticButton from '../common/MagneticButton';
import DisciplineIcon from '../common/DisciplineIcon';
import ScrollPanel from '../layout/ScrollPanel';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import './Hero.css';

const DISCIPLINES = [
  { icon: 'web', label: 'Web' },
  { icon: 'software', label: 'Software' },
  { icon: 'hardware', label: 'Embedded Hardware' },
];

const HIGHLIGHTS = [
  '10–15 day typical turnaround',
  '100% source code handed over',
  '7 days of post-delivery support',
];

export default function Hero() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <ScrollPanel index={1} id="hero">
      {(scrollYProgress) => (
        <HeroContent scrollYProgress={scrollYProgress} reduceMotion={reduceMotion} />
      )}
    </ScrollPanel>
  );
}

function HeroContent({ scrollYProgress, reduceMotion }) {
  // Hero holds steady while it's the only thing on screen, then eases back
  // and fades as Services starts sliding up to cover it — scroll-scrubbed,
  // not a fixed-duration exit animation.
  const scale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.35]);
  const y = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0, -40]);

  return (
    <motion.div
      className="panel-inner hero-inner"
      style={reduceMotion ? undefined : { scale, opacity, y }}
    >
      <div className="hero-disciplines" role="list" aria-label="What we build">
        {DISCIPLINES.map((d) => (
          <span className="hero-discipline" role="listitem" key={d.icon}>
            <DisciplineIcon type={d.icon} />
            {d.label}
          </span>
        ))}
      </div>
      <KineticText
        as="h1"
        className="gradient-headline hero-title"
        text="We build the systems behind ambitious ideas."
      />
      <p className="hero-subtitle">
        Unitary X is a freelance dev studio delivering production-grade web, software, and embedded
        hardware — from first prototype to shipped product.
      </p>
      <div className="hero-actions">
        <MagneticButton as="a" href="#contact">
          Start a project
        </MagneticButton>
        <a className="hero-secondary-link" href="#projects">
          See our work →
        </a>
      </div>
      <ul className="hero-highlights">
        {HIGHLIGHTS.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </motion.div>
  );
}
