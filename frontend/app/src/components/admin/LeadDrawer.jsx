import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SaveBadge from './SaveBadge';
import { useSaveStatus } from './useSaveStatus';

const STATUSES = ['New', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function fmtId(id) {
  return String(id).padStart(4, '0');
}

export default function LeadDrawer({ lead, isSuper, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    status: lead.status,
    priority: lead.priority,
    value: lead.value || 0,
    internal_notes: lead.internal_notes || '',
  });
  const { status: saveState, error, run } = useSaveStatus();

  useEffect(() => {
    setForm({
      status: lead.status,
      priority: lead.priority,
      value: lead.value || 0,
      internal_notes: lead.internal_notes || '',
    });
  }, [lead]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    try {
      await run(() => onSave(lead.id, form));
    } catch {
      /* SaveBadge shows the error */
    }
  };

  const sensitive = !isSuper && (form.status === 'Done' || form.priority === 'High' || Number(form.value) >= 20000);

  return (
    <div className="studio-overlay" onClick={onClose} role="presentation">
      <motion.div
        className="lead-drawer glass-strong"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Inquiry ${fmtId(lead.id)}`}
      >
        <div className="studio-modal-head">
          <div>
            <p className="studio-eyebrow">Inquiry #{fmtId(lead.id)}</p>
            <h3>{lead.name}</h3>
          </div>
          <button type="button" className="studio-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <dl className="lead-meta">
          <div>
            <dt>Email</dt>
            <dd className="admin-mono">{lead.email}</dd>
          </div>
          {lead.phone && (
            <div>
              <dt>Phone</dt>
              <dd className="admin-mono">{lead.phone}</dd>
            </div>
          )}
          <div>
            <dt>Service</dt>
            <dd>{lead.service}</dd>
          </div>
          {lead.deadline && (
            <div>
              <dt>Deadline</dt>
              <dd>{lead.deadline}</dd>
            </div>
          )}
          <div>
            <dt>Lead score</dt>
            <dd>
              Tier {lead.lead_tier} · {lead.lead_score_total} (value {lead.lead_score_value} / urgency{' '}
              {lead.lead_score_urgency} / conversion {lead.lead_score_conversion})
            </dd>
          </div>
        </dl>

        <div className="lead-message">
          <span className="studio-field-label">Message</span>
          <p>{lead.message}</p>
        </div>

        <div className="studio-field-row">
          <label className="studio-field">
            Status
            <select value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field">
            Priority
            <select value={form.priority} onChange={(e) => set({ priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="studio-field">
          Value (Rs)
          <input type="number" value={form.value} onChange={(e) => set({ value: Number(e.target.value) })} />
        </label>
        <label className="studio-field">
          Internal notes (admin-only)
          <textarea
            rows={3}
            value={form.internal_notes}
            onChange={(e) => set({ internal_notes: e.target.value })}
          />
        </label>

        {sensitive && (
          <p className="lead-approval-note">
            This change is sensitive — it will be queued for superadmin approval instead of applied directly.
          </p>
        )}

        <div className="studio-modal-foot">
          <SaveBadge status={saveState} error={error} savedLabel="Saved" />
          <div className="studio-modal-foot-actions">
            <button type="button" className="studio-btn studio-btn--danger" onClick={() => onDelete(lead)}>
              Delete
            </button>
            <button type="button" className="studio-btn studio-btn--primary" onClick={save} disabled={saveState === 'saving'}>
              Save changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
