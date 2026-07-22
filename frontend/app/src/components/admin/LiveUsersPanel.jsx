import { useCallback, useEffect, useRef, useState } from 'react';
import { getJSON } from '../../lib/api';

const REFRESH_MS = 15000;

export default function LiveUsersPanel() {
  const [website, setWebsite] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timer = useRef(null);

  const load = useCallback(() => {
    Promise.all([getJSON('/admin/api/live-website-users'), getJSON('/admin/api/live-users')])
      .then(([w, s]) => {
        setWebsite(w);
        setSessions(s);
        setError('');
        setLastUpdated(new Date());
      })
      .catch((err) => setError(err.message || 'Could not load live users'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    timer.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer.current);
  }, [autoRefresh, load]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!website || !sessions) return <p className="admin-muted">Loading live users…</p>;

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Live users</h2>
          <p className="admin-section-note">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
            {autoRefresh ? ' · auto-refreshing' : ''}
          </p>
        </div>
        <div className="admin-section-head-actions">
          <label className="dash-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button type="button" className="studio-btn" onClick={load}>
            Refresh now
          </button>
        </div>
      </div>

      <div className="analytics-kpis">
        <article className="kpi-card glass">
          <p className="kpi-label">On site now</p>
          <p className="kpi-value">{website.active_website_users}</p>
          <p className="kpi-sub">Visitors in last 5 min</p>
        </article>
        <article className="kpi-card glass">
          <p className="kpi-label">Active sessions</p>
          <p className="kpi-value">{sessions.active_session_users}</p>
          <p className="kpi-sub">Logged-in users</p>
        </article>
        <article className="kpi-card glass">
          <p className="kpi-label">Total users</p>
          <p className="kpi-value">{sessions.total_users}</p>
          <p className="kpi-sub">Registered accounts</p>
        </article>
      </div>

      <div className="admin-card glass">
        <h3 className="dash-card-title">Live website visitors</h3>
        {website.live_users.length === 0 ? (
          <p className="admin-muted">No visitors on the site right now.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Page</th>
                  <th>Events</th>
                  <th>Last seen</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {website.live_users.map((u) => (
                  <tr key={u.visitor_id}>
                    <td>
                      <span className="admin-row-title">{u.name}</span>
                      <span className="admin-mono admin-muted-inline">{u.email}</span>
                    </td>
                    <td className="admin-mono">{u.page_path}</td>
                    <td>{u.event_count}</td>
                    <td className="admin-mono">{u.last_seen}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.state === 'authenticated' ? 'ok' : 'muted'}`}>
                        {u.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sessions.logged_in_users && (
        <div className="admin-card glass">
          <h3 className="dash-card-title">Logged-in sessions</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Sessions</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {sessions.logged_in_users.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <span className="admin-row-title">{u.name}</span>
                      <span className="admin-mono admin-muted-inline">{u.email}</span>
                    </td>
                    <td>
                      {u.role}
                      {u.admin_scope ? ` · ${u.admin_scope}` : ''}
                    </td>
                    <td>{u.session_count}</td>
                    <td className="admin-mono">{u.last_seen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
