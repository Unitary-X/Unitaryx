import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '../../lib/api';

export default function SessionsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    getJSON('/api/admin/sessions')
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load sessions'));

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading sessions…</p>;

  const revoke = async (s) => {
    const label = s.is_current ? 'This is your current session — revoking will sign you out. Continue?' : `Revoke this session for ${s.user_email}?`;
    if (!window.confirm(label)) return;
    try {
      const res = await postJSON(`/api/admin/sessions/${s.id}/revoke`, {});
      if (res.revoked_self) {
        window.location.href = '/login';
        return;
      }
      await load();
    } catch (err) {
      window.alert(err.message || 'Could not revoke session.');
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm('Sign out all your OTHER devices? Your current session stays active.')) return;
    try {
      const res = await postJSON('/api/admin/sessions/revoke-others', {});
      window.alert(`Revoked ${res.revoked} other session(s).`);
      await load();
    } catch (err) {
      window.alert(err.message || 'Could not revoke sessions.');
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Active sessions</h2>
          <p className="admin-section-note">
            {data.sessions.length} active {data.is_super ? '· all users' : '· your devices'}
          </p>
        </div>
        <button type="button" className="studio-btn" onClick={revokeOthers}>
          Sign out my other devices
        </button>
      </div>

      {data.sessions.length === 0 ? (
        <div className="admin-empty glass">
          <p className="admin-empty-title">No active sessions</p>
        </div>
      ) : (
        <div className="admin-card glass">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP</th>
                  <th>Device</th>
                  <th>Last seen</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="admin-row-title">
                        {s.user_name}
                        {s.is_current && <span className="admin-badge admin-badge--ok super-tag">This device</span>}
                      </span>
                      <span className="admin-mono admin-muted-inline">{s.user_email}</span>
                    </td>
                    <td className="admin-mono">{s.ip_address || '—'}</td>
                    <td className="session-ua" title={s.user_agent || ''}>
                      {s.user_agent || '—'}
                    </td>
                    <td className="admin-mono">{s.last_seen || '—'}</td>
                    <td>
                      <button type="button" className="studio-btn studio-btn--danger" onClick={() => revoke(s)}>
                        Revoke
                      </button>
                    </td>
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
