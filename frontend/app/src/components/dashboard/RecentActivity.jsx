import { formatId, formatDate, statusSlug } from './dashboardUtils';

export default function RecentActivity({ requests }) {
  const recent = requests.slice(0, 5);
  return (
    <section className="dash-card glass">
      <h2 className="dash-card-title">Recent activity</h2>
      {recent.length === 0 ? (
        <p className="dash-muted">Activity will appear here once you submit requests.</p>
      ) : (
        <ul className="activity-list">
          {recent.map((r) => (
            <li key={r.id}>
              <span className={`activity-dot activity-dot--${statusSlug(r.status)}`} aria-hidden="true" />
              <div>
                <p className="activity-main">
                  #{formatId(r.id)} — {r.status}
                </p>
                <p className="activity-sub">
                  {formatDate(r.created_at)} · {r.service}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
