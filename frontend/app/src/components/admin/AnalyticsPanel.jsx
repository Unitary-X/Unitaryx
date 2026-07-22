import { useEffect, useState } from 'react';
import { getJSON } from '../../lib/api';
import StackedBarChart from './StackedBarChart';

const RANGES = [7, 14, 30];

export default function AnalyticsPanel() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getJSON('/admin/api/traffic-summary'), getJSON(`/admin/api/traffic-daily-pages?days=${days}`)])
      .then(([s, d]) => {
        if (cancelled) return;
        setSummary(s);
        setDaily(d);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading && !summary) return <p className="admin-muted">Loading analytics…</p>;
  if (error) return <p className="admin-error">{error}</p>;

  const kpis = [
    { label: 'Active now', value: summary.active_now, sub: 'Last 5 minutes' },
    { label: 'Page opens today', value: summary.today_opens, sub: 'page_view events' },
    { label: 'Unique visitors today', value: summary.unique_visitors_today, sub: 'Distinct visitors' },
    { label: 'Scrolled today', value: summary.today_scrolled, sub: '25%+ scroll depth' },
    { label: 'Avg scroll depth', value: `${summary.avg_scroll_depth}%`, sub: 'Per visitor max' },
    { label: 'Registered users', value: summary.registered_total, sub: 'All time' },
  ];

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Traffic analytics</h2>
          <p className="admin-section-note">Live site traffic and engagement</p>
        </div>
        <a className="studio-btn" href="/admin/export/traffic-csv">
          Export traffic CSV
        </a>
      </div>

      <div className="analytics-kpis">
        {kpis.map((k) => (
          <article key={k.label} className="kpi-card glass">
            <p className="kpi-label">{k.label}</p>
            <p className="kpi-value">{k.value}</p>
            <p className="kpi-sub">{k.sub}</p>
          </article>
        ))}
      </div>

      <div className="admin-card glass">
        <div className="admin-card-head">
          <h3 className="dash-card-title">Page views by section</h3>
          <div className="range-switch">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={`studio-tab ${days === r ? 'active' : ''}`}
                onClick={() => setDays(r)}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
        {daily && <StackedBarChart labels={daily.labels} datasets={daily.datasets} />}
      </div>

      <div className="admin-card glass">
        <h3 className="dash-card-title">Registered users ({summary.registered_total})</h3>
        {summary.registered_users.length === 0 ? (
          <p className="admin-muted">No registered users yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {summary.registered_users.slice(0, 25).map((u, i) => (
                  <tr key={`${u.email}-${i}`}>
                    <td>{u.name}</td>
                    <td className="admin-mono">{u.email}</td>
                    <td className="admin-mono">{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
