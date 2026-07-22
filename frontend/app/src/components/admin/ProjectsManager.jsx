import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { getJSON, postJSON, putJSON, deleteReq } from '../../lib/api';
import { useSaveStatus } from './useSaveStatus';
import ProjectForm from './ProjectForm';
import SaveBadge from './SaveBadge';

function ProjectRow({ project, onEdit, onDelete, onToggleFeatured, onReorderEnd }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={project}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onReorderEnd}
      className="admin-row glass"
    >
      <button
        type="button"
        className="admin-drag"
        aria-label="Drag to reorder"
        onPointerDown={(e) => controls.start(e)}
      >
        ⠿
      </button>
      <div className="admin-row-thumb admin-row-thumb--landscape">
        {project.photo_url ? <img src={project.photo_url} alt="" /> : <span>{project.title.charAt(0)}</span>}
      </div>
      <div className="admin-row-main">
        <p className="admin-row-title">{project.title}</p>
        <p className="admin-row-sub">{project.category}</p>
      </div>
      <button
        type="button"
        className={`admin-star ${project.featured ? 'active' : ''}`}
        aria-pressed={project.featured}
        title={project.featured ? 'Featured' : 'Not featured'}
        onClick={() => onToggleFeatured(project)}
      >
        {project.featured ? '★' : '☆'}
      </button>
      <div className="admin-row-actions">
        <button type="button" className="studio-btn studio-btn--ghost" onClick={() => onEdit(project)}>
          Edit
        </button>
        <button type="button" className="studio-btn studio-btn--danger" onClick={() => onDelete(project)}>
          Delete
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const projectsRef = useRef(projects);
  const { status: orderStatus, run: runOrder } = useSaveStatus();

  projectsRef.current = projects;

  const load = () => {
    setLoading(true);
    getJSON('/api/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const persistOrder = () => {
    const order = projectsRef.current.map((p) => p.id);
    runOrder(() => postJSON('/api/admin/projects/reorder', { order })).catch(() => load());
  };

  const handleSave = async (data, id) => {
    if (id) {
      const res = await putJSON(`/api/admin/projects/${id}`, data);
      setProjects((list) => list.map((p) => (p.id === id ? res.project : p)));
    } else {
      const res = await postJSON('/api/admin/projects', data);
      setProjects((list) => [...list, res.project]);
    }
    setEditing(null);
  };

  const handleToggleFeatured = async (project) => {
    const res = await putJSON(`/api/admin/projects/${project.id}`, { featured: !project.featured });
    setProjects((list) => list.map((p) => (p.id === project.id ? res.project : p)));
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    await deleteReq(`/api/admin/projects/${project.id}`);
    setProjects((list) => list.filter((p) => p.id !== project.id));
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Projects</h2>
          <p className="admin-section-note">
            {projects.length} project{projects.length === 1 ? '' : 's'} · drag to reorder · ★ to feature
          </p>
        </div>
        <div className="admin-section-head-actions">
          <SaveBadge status={orderStatus} savedLabel="Order saved" />
          <button type="button" className="studio-btn studio-btn--primary" onClick={() => setEditing('new')}>
            Add project
          </button>
        </div>
      </div>

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="admin-empty glass">
          <p className="admin-empty-title">No projects yet</p>
          <p className="admin-muted">Add your first build to show it in the portfolio grid.</p>
          <button type="button" className="studio-btn studio-btn--primary" onClick={() => setEditing('new')}>
            Add your first project
          </button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={projects} onReorder={setProjects} className="admin-list">
          {projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              onEdit={setEditing}
              onDelete={handleDelete}
              onToggleFeatured={handleToggleFeatured}
              onReorderEnd={persistOrder}
            />
          ))}
        </Reorder.Group>
      )}

      {editing && (
        <ProjectForm
          project={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
