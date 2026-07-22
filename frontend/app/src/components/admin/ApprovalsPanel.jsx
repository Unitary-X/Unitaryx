import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '../../lib/api';

function prettyPayload(raw) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw || '';
  }
}

export default function ApprovalsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getJSON('/api/admin/approvals')
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load approvals'));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading approvals…</p>;

  const decide = async (ticket, decision) => {
    let note = '';
    if (decision === 'reject') {
      note = window.prompt(`Reason for rejecting ticket #${ticket.id} (optional):`, '') ?? '';
    } else if (!window.confirm(`Approve ticket #${ticket.id}? This executes the requested action.`)) {
      return;
    }
    setBusyId(ticket.id);
    try {
      const res = await postJSON(`/api/admin/approvals/${ticket.id}/${decision}`, { review_note: note });
      setData((d) => ({ ...d, tickets: d.tickets.map((t) => (t.id === ticket.id ? res.ticket : t)) }));
    } catch (err) {
      window.alert(err.message || 'Could not complete the review.');
    } finally {
      setBusyId(null);
    }
  };

  const pending = data.tickets.filter((t) => t.status === 'pending');
  const reviewed = data.tickets.filter((t) => t.status !== 'pending');

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Approvals</h2>
          <p className="admin-section-note">
            {pending.length} pending · {reviewed.length} reviewed
            {!data.can_review && ' · read-only (requires superadmin)'}
          </p>
        </div>
      </div>

      {data.tickets.length === 0 ? (
        <div className="admin-empty glass">
          <p className="admin-empty-title">No approval tickets</p>
          <p className="admin-muted">Sensitive admin actions that need sign-off will queue up here.</p>
        </div>
      ) : (
        <>
          {pending.map((t) => (
            <article key={t.id} className="admin-card glass">
              <div className="admin-card-head">
                <div>
                  <h3 className="dash-card-title">
                    #{t.id} · {t.action_key}
                  </h3>
                  <p className="admin-muted-inline">
                    Requested by {t.requested_by_email} ({t.requested_by_scope})
                  </p>
                  {t.reason && <p className="admin-muted-inline">Reason: {t.reason}</p>}
                </div>
                <span className="admin-badge admin-badge--new">pending</span>
              </div>
              <pre className="approval-payload">{prettyPayload(t.payload_json)}</pre>
              {data.can_review && (
                <div className="ab-actions">
                  <button
                    type="button"
                    className="studio-btn studio-btn--danger"
                    disabled={busyId === t.id}
                    onClick={() => decide(t, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="studio-btn studio-btn--primary"
                    disabled={busyId === t.id}
                    onClick={() => decide(t, 'approve')}
                  >
                    Approve &amp; execute
                  </button>
                </div>
              )}
            </article>
          ))}

          {reviewed.length > 0 && (
            <div className="admin-card glass">
              <h3 className="dash-card-title">Reviewed</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Status</th>
                      <th>Reviewer</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewed.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span className="admin-row-title">
                            #{t.id} {t.action_key}
                          </span>
                          <span className="admin-muted-inline">by {t.requested_by_email}</span>
                        </td>
                        <td>
                          <span
                            className={`admin-badge admin-badge--${t.status === 'approved' ? 'ok' : 'muted'}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="admin-mono">{t.reviewed_by_email || '—'}</td>
                        <td>{t.review_note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
