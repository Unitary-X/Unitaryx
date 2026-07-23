import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import SkeletonCard from '../../common/SkeletonCard';
import { useProjects } from '../../../hooks/useProjects';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import './ProjectsGrid.css';

const LABEL_OVERRIDES = { ai: 'AI' };

function label(cat) {
  const key = (cat || '').toLowerCase();
  return LABEL_OVERRIDES[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export default function ProjectsGrid() {
  const { projects, loading } = useProjects();
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState('all');

  const domains = useMemo(() => {
    const set = new Set(projects.map((p) => (p.category || '').toLowerCase()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(
    () => (active === 'all' ? projects : projects.filter((p) => (p.category || '').toLowerCase() === active)),
    [projects, active]
  );

  let body;
  if (loading) {
    body = (
      <div className="projects-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="project-skeleton" />
        ))}
      </div>
    );
  } else if (!projects.length) {
    body = <p className="projects-empty">Project case studies are coming soon.</p>;
  } else {
    body = (
      <>
        {domains.length > 2 && (
          <div className="projects-filter" role="tablist" aria-label="Filter projects by domain">
            {domains.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={active === d}
                className={`projects-filter-tab ${active === d ? 'active' : ''}`}
                onClick={() => setActive(d)}
              >
                {d === 'all' ? 'All' : label(d)}
              </button>
            ))}
          </div>
        )}
        <div className="projects-grid">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: Math.min(0.3, (i % 3) * 0.08) }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="projects-section" id="projects">
      <div className="section-inner">
        <span className="eyebrow">Selected work</span>
        <h2 className="gradient-headline projects-title">Projects we&apos;ve shipped</h2>
        {body}
      </div>
    </section>
  );
}
