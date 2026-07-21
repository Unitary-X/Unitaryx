import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import FounderCard from './FounderCard';
import SkeletonCard from '../../common/SkeletonCard';
import KineticText from '../../common/KineticText';
import ScrollPanel from '../../layout/ScrollPanel';
import { useFounders } from '../../../hooks/useFounders';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import './FoundersCarousel.css';

const AUTO_ROTATE_MS = 4000;
const GROUP_SIZE = 3;
const OFFSET_X = 230;

function shortestDistance(index, active, count) {
  const raw = index - active;
  const wrapped = ((raw % count) + count) % count;
  return wrapped > count / 2 ? wrapped - count : wrapped;
}

function cardStyle(distance) {
  const abs = Math.abs(distance);
  if (abs > 2) {
    return { transform: `translate(-50%, -50%) translateX(${distance * OFFSET_X}px) scale(0.6)`, opacity: 0, zIndex: 0 };
  }
  return {
    transform: `translate(-50%, -50%) translateX(${distance * OFFSET_X}px) scale(${1 - abs * 0.18})`,
    filter: `blur(${abs * 2.5}px) brightness(${1 - abs * 0.15})`,
    opacity: 1 - abs * 0.35,
    zIndex: 10 - abs,
  };
}

export default function FoundersCarousel() {
  const { founders, loading } = useFounders();
  const reduceMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = founders.length;

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return undefined;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, paused, count]);

  const groups = useMemo(() => {
    const total = Math.ceil(count / GROUP_SIZE) || 1;
    return Array.from({ length: total }, (_, g) => g * GROUP_SIZE);
  }, [count]);

  const activeGroup = Math.floor(activeIndex / GROUP_SIZE);

  const goTo = (index) => setActiveIndex(((index % count) + count) % count);

  let body;
  if (loading) {
    body = (
      <div className="founders-carousel">
        <div className="founders-stage">
          <SkeletonCard className="founder-skeleton" />
        </div>
      </div>
    );
  } else if (!count) {
    body = <p className="founders-empty">Team profiles are coming soon.</p>;
  } else {
    body = (
    <div
      className="founders-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="founders-stage">
        {founders.map((founder, i) => {
          const distance = shortestDistance(i, activeIndex, count);
          if (Math.abs(distance) > 2) return null;
          return (
            <motion.div
              key={founder.id}
              animate={cardStyle(distance)}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
              style={{ position: 'absolute', top: '50%', left: '50%' }}
            >
              <FounderCard founder={founder} isActive={distance === 0} />
            </motion.div>
          );
        })}
      </div>

      <div className="founders-controls">
        <button
          type="button"
          className="founders-arrow"
          aria-label="Previous team member"
          onClick={() => goTo(activeIndex - 1)}
        >
          ←
        </button>

        <div className="founders-dots" role="tablist" aria-label="Team member groups">
          <span
            className="founders-dots-underline"
            style={{ transform: `translateX(${activeGroup * 100}%)`, width: `${100 / groups.length}%` }}
          />
          {groups.map((startIndex, g) => (
            <button
              key={startIndex}
              type="button"
              role="tab"
              aria-selected={g === activeGroup}
              aria-label={`Team members ${startIndex + 1} to ${Math.min(startIndex + GROUP_SIZE, count)}`}
              className={`founders-dot ${g === activeGroup ? 'active' : ''}`}
              onClick={() => goTo(startIndex)}
            />
          ))}
        </div>

        <button
          type="button"
          className="founders-arrow"
          aria-label="Next team member"
          onClick={() => goTo(activeIndex + 1)}
        >
          →
        </button>
      </div>
    </div>
    );
  }

  return (
    <ScrollPanel index={3} id="founders">
      <div className="panel-inner founders-panel-inner">
        <span className="eyebrow">The team</span>
        <KineticText as="h2" className="gradient-headline founders-title" text="Meet the builders of Unitary X" />
        {body}
      </div>
    </ScrollPanel>
  );
}
