import ProjectCard from './ProjectCard';
import SkeletonCard from '../../common/SkeletonCard';
import ScrollPanel from '../../layout/ScrollPanel';
import { useProjects } from '../../../hooks/useProjects';
import './ProjectsGrid.css';

export default function ProjectsGrid() {
  const { projects, loading } = useProjects();

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
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  }

  return (
    <ScrollPanel index={4} id="projects">
      <div className="panel-inner">
        <span className="eyebrow">Selected work</span>
        <h2 className="gradient-headline projects-title">Projects we've shipped</h2>
        {body}
      </div>
    </ScrollPanel>
  );
}
