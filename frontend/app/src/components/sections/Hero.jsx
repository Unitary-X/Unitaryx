import KineticText from '../common/KineticText';
import MagneticButton from '../common/MagneticButton';
import ScrollPanel from '../layout/ScrollPanel';
import './Hero.css';

export default function Hero() {
  return (
    <ScrollPanel index={1} id="hero">
      <div className="panel-inner hero-inner">
        <span className="eyebrow">Web · Software · Embedded Hardware</span>
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
      </div>
    </ScrollPanel>
  );
}
