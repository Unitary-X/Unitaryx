// Lightweight SVG stacked bar chart — avoids pulling in Chart.js for the
// admin analytics view (keeps the bundle small, matches the site's palette).
const SERIES_COLORS = ['#2F5CFF', '#B8873E', '#2FA36B', '#8890AC', '#C9D6FF'];

const WIDTH = 720;
const HEIGHT = 220;
const PAD_LEFT = 34;
const PAD_BOTTOM = 26;
const PAD_TOP = 10;

export default function StackedBarChart({ labels = [], datasets = [] }) {
  const dayTotals = labels.map((_, i) =>
    datasets.reduce((sum, ds) => sum + (ds.data[i] || 0), 0)
  );
  const max = Math.max(1, ...dayTotals);

  const plotW = WIDTH - PAD_LEFT;
  const plotH = HEIGHT - PAD_BOTTOM - PAD_TOP;
  const slot = plotW / Math.max(labels.length, 1);
  const barW = Math.max(4, Math.min(28, slot * 0.6));

  // y gridlines at 0 / 50% / 100%
  const ticks = [0, Math.round(max / 2), max];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img" aria-label="Daily page views by section">
        {ticks.map((t) => {
          const y = PAD_TOP + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={PAD_LEFT} x2={WIDTH} y1={y} y2={y} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" className="chart-tick">
                {t}
              </text>
            </g>
          );
        })}

        {labels.map((label, i) => {
          const x = PAD_LEFT + i * slot + (slot - barW) / 2;
          let cursorY = PAD_TOP + plotH;
          return (
            <g key={label}>
              {datasets.map((ds, di) => {
                const value = ds.data[i] || 0;
                if (!value) return null;
                const h = (value / max) * plotH;
                cursorY -= h;
                return (
                  <rect
                    key={ds.label}
                    x={x}
                    y={cursorY}
                    width={barW}
                    height={h}
                    fill={SERIES_COLORS[di % SERIES_COLORS.length]}
                    rx="2"
                  >
                    <title>{`${label} · ${ds.label}: ${value}`}</title>
                  </rect>
                );
              })}
              {(labels.length <= 16 || i % 2 === 0) && (
                <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-tick">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <ul className="chart-legend">
        {datasets.map((ds, i) => (
          <li key={ds.label}>
            <span className="legend-dot" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {ds.label}
            <span className="legend-value">{ds.data.reduce((a, b) => a + b, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
