import { useEffect, useMemo, useState } from 'react';
import { getJSON, postJSON, putJSON } from '../../lib/api';
import { useSaveStatus } from './useSaveStatus';
import SaveBadge from './SaveBadge';

const STATUSES = ['submitted', 'processed', 'needs_superadmin_check', 'closed'];
const STATUS_LABEL = {
  submitted: 'Submitted',
  processed: 'Processed',
  needs_superadmin_check: 'Needs check',
  closed: 'Closed',
  rejected: 'Rejected',
};

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-IN')}`;
}

const EMPTY = { entry_type: 'receivable', title: '', counterparty: '', amount: '', due_date: '', notes: '' };

export default function FinancePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const { status: saveState, error: saveError, run } = useSaveStatus();

  useEffect(() => {
    getJSON('/api/admin/finance')
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load finance entries'));
  }, []);

  const totals = useMemo(() => {
    if (!data) return null;
    const t = { receivable: 0, payable: 0, needsCheck: 0 };
    data.entries.forEach((e) => {
      if (e.status !== 'closed' && e.status !== 'rejected') {
        if (e.entry_type === 'receivable') t.receivable += e.amount || 0;
        else t.payable += e.amount || 0;
      }
      if (e.status === 'needs_superadmin_check') t.needsCheck += 1;
    });
    return t;
  }, [data]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading finance…</p>;

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await run(() => postJSON('/api/admin/finance', form));
      setData((d) => ({ ...d, entries: [res.entry, ...d.entries] }));
      setForm(EMPTY);
    } catch (err) {
      setFormError(err.message || 'Could not create entry.');
    }
  };

  const setStatus = async (entry, status) => {
    try {
      const res = await putJSON(`/api/admin/finance/${entry.id}/status`, { status });
      setData((d) => ({ ...d, entries: d.entries.map((x) => (x.id === entry.id ? res.entry : x)) }));
    } catch (err) {
      window.alert(err.message || 'Could not update status.');
    }
  };

  const review = async (entry, decision) => {
    const note = window.prompt(`Add a review note for #${entry.id} (optional):`, '') ?? '';
    try {
      const res = await putJSON(`/api/admin/finance/${entry.id}/review`, { decision, review_note: note });
      setData((d) => ({ ...d, entries: d.entries.map((x) => (x.id === entry.id ? res.entry : x)) }));
    } catch (err) {
      window.alert(err.message || 'Could not review entry.');
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Finance</h2>
          <p className="admin-section-note">
            {data.entries.length} entr{data.entries.length === 1 ? 'y' : 'ies'}
            {data.can_review ? ' · superadmin review enabled' : ''}
          </p>
        </div>
      </div>

      <div className="analytics-kpis">
        <article className="kpi-card glass">
          <p className="kpi-label">Open receivables</p>
          <p className="kpi-value">{money(totals.receivable)}</p>
          <p className="kpi-sub">Not closed</p>
        </article>
        <article className="kpi-card glass">
          <p className="kpi-label">Open payables</p>
          <p className="kpi-value">{money(totals.payable)}</p>
          <p className="kpi-sub">Not closed</p>
        </article>
        <article className="kpi-card glass">
          <p className="kpi-label">Awaiting check</p>
          <p className="kpi-value">{totals.needsCheck}</p>
          <p className="kpi-sub">Superadmin queue</p>
        </article>
      </div>

      <form className="admin-card glass workflow-form" onSubmit={submit}>
        <h3 className="dash-card-title">New finance entry</h3>
        <div className="studio-field-row">
          <label className="studio-field">
            Type
            <select
              value={form.entry_type}
              onChange={(e) => setForm((f) => ({ ...f, entry_type: e.target.value }))}
            >
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
            </select>
          </label>
          <label className="studio-field">
            Amount
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </label>
        </div>
        <div className="studio-field-row">
          <label className="studio-field">
            Title
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="studio-field">
            Counterparty
            <input
              value={form.counterparty}
              onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))}
            />
          </label>
        </div>
        <div className="studio-field-row">
          <label className="studio-field">
            Due date
            <input
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              placeholder="2026-08-31"
            />
          </label>
          <label className="studio-field">
            Notes
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
        </div>
        <div className="workflow-form-foot">
          {formError && <span className="studio-field-error">{formError}</span>}
          <SaveBadge status={saveState} error={saveError} savedLabel="Created" />
          <button type="submit" className="studio-btn studio-btn--primary" disabled={saveState === 'saving'}>
            Create entry
          </button>
        </div>
      </form>

      {data.entries.length === 0 ? (
        <div className="admin-empty glass">
          <p className="admin-empty-title">No finance entries yet</p>
          <p className="admin-muted">Create the first receivable or payable above.</p>
        </div>
      ) : (
        <div className="admin-card glass">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => {
                  const mine = e.assigned_admin_email === data.my_email;
                  const canEdit = mine || data.can_review;
                  const inQueue = e.status === 'needs_superadmin_check';
                  return (
                    <tr key={e.id}>
                      <td>
                        <span className="admin-row-title">
                          #{e.id} {e.title}
                        </span>
                        <span className="admin-muted-inline">
                          {e.counterparty}
                          {e.due_date ? ` · due ${e.due_date}` : ''}
                        </span>
                        {e.review_note && (
                          <span className="admin-muted-inline">Review: {e.review_note}</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${e.entry_type === 'receivable' ? 'ok' : 'muted'}`}>
                          {e.entry_type}
                        </span>
                      </td>
                      <td className="admin-mono">{money(e.amount)}</td>
                      <td className="admin-mono">{e.assigned_admin_email}</td>
                      <td>
                        {canEdit && e.status !== 'rejected' ? (
                          <select
                            className="dash-select"
                            value={e.status}
                            onChange={(ev) => setStatus(e, ev.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="admin-badge admin-badge--muted">{STATUS_LABEL[e.status] || e.status}</span>
                        )}
                      </td>
                      <td>
                        {data.can_review && inQueue && (
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="studio-btn studio-btn--primary"
                              onClick={() => review(e, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="studio-btn studio-btn--danger"
                              onClick={() => review(e, 'reject')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
