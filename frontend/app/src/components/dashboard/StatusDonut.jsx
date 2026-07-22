const COLORS = {
  New: 'var(--cobalt)',
  'In Progress': 'var(--brass)',
  Done: '#2FA36B',
};

const RADIUS = 60;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatusDonut({ counts }) {
  const segments = [
    { label: 'New', value: counts.New },
    { label: 'In Progress', value: counts['In Progress'] },
    { label: 'Done', value: counts.Done },
  ];
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total ? seg.value / total : 0;
    const dash = fraction * CIRCUMFERENCE;
    const arc = {
      ...seg,
      dashArray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashOffset: -offset,
    };
    offset += dash;
    return arc;
  });

  return (
    <div className="status-donut glass">
      <h3 className="dash-card-title">Status breakdown</h3>
      <div className="status-donut-body">
        <svg viewBox="0 0 160 160" className="status-donut-svg" role="img" aria-label="Request status breakdown">
          <g transform="rotate(-90 80 80)">
            <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth={STROKE} />
            {total > 0 &&
              arcs.map((arc) => (
                <circle
                  key={arc.label}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke={COLORS[arc.label]}
                  strokeWidth={STROKE}
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                />
              ))}
          </g>
          <text x="80" y="74" textAnchor="middle" className="status-donut-total">
            {total}
          </text>
          <text x="80" y="94" textAnchor="middle" className="status-donut-caption">
            requests
          </text>
        </svg>
        <ul className="status-donut-legend">
          {segments.map((seg) => (
            <li key={seg.label}>
              <span className="legend-dot" style={{ background: COLORS[seg.label] }} />
              {seg.label}
              <span className="legend-value">{seg.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
