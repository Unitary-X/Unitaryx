export const STATUSES = ['New', 'In Progress', 'Done'];

export function priorityScore(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

export function statusSlug(status) {
  return (status || '').toLowerCase().replace(/\s+/g, '-');
}

export function formatId(id) {
  return String(id).padStart(4, '0');
}

export function formatValue(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function sortTimestamp(iso) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

// Status-derived roadmap: which of the 5 phases are complete/active for a status.
export const ROADMAP_STEPS = [
  { key: 'requirement', label: 'Requirement' },
  { key: 'planning', label: 'Planning' },
  { key: 'development', label: 'Development' },
  { key: 'qa', label: 'Quality Assurance' },
  { key: 'deployment', label: 'Deployment' },
];

// Returns the index of the currently-active step for a given status.
// New -> Planning (1), In Progress -> Development (2), Done -> Deployment done (5).
export function activeStepIndex(status) {
  switch (status) {
    case 'Done':
      return ROADMAP_STEPS.length; // all complete
    case 'In Progress':
      return 2;
    default:
      return 1; // New
  }
}
