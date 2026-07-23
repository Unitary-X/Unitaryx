export default function StatusPills({ counts }) {
  const pills = [
    { label: 'Total', value: counts.total, tone: 'ink' },
    { label: 'New', value: counts.New, tone: 'new' },
    { label: 'In Progress', value: counts['In Progress'], tone: 'progress' },
    { label: 'Done', value: counts.Done, tone: 'done' },
    { label: 'Updates', value: counts.updates, tone: 'brass' },
  ];
  return (
    <div className="status-pills glass">
      <h3 className="dash-card-title">At a glance</h3>
      <div className="status-pills-row">
        {pills.map((p) => (
          <div key={p.label} className={`status-pill status-pill--${p.tone}`}>
            <span className="status-pill-value">{p.value}</span>
            <span className="status-pill-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
