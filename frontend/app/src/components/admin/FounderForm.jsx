import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from './ImageUpload';
import SaveBadge from './SaveBadge';
import { useSaveStatus } from './useSaveStatus';

const SOCIAL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'website', label: 'Website' },
];

function emptyForm() {
  return { name: '', role: '', bio: '', photo_url: '', socials: {}, active: true };
}

export default function FounderForm({ founder, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const { status, error, run } = useSaveStatus();

  useEffect(() => {
    if (founder) {
      setForm({
        name: founder.name || '',
        role: founder.role || '',
        bio: founder.bio || '',
        photo_url: founder.photo_url || '',
        socials: founder.socials || {},
        active: founder.active !== false,
      });
    } else {
      setForm(emptyForm());
    }
  }, [founder]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSocial = (key, val) => setForm((f) => ({ ...f, socials: { ...f.socials, [key]: val } }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    // strip empty socials
    const socials = Object.fromEntries(
      Object.entries(form.socials).filter(([, v]) => v && v.trim())
    );
    const payload = { ...form, socials };
    try {
      await run(() => onSave(payload, founder?.id));
    } catch {
      /* SaveBadge shows the error */
    }
  };

  return (
    <div className="studio-overlay" onClick={onClose} role="presentation">
      <motion.form
        className="studio-modal glass-strong"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="studio-modal-head">
          <h3>{founder ? 'Edit member' : 'Add member'}</h3>
          <button type="button" className="studio-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="studio-form-grid">
          <div className="studio-form-col">
            <label className="studio-field">
              Name
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
              {fieldErrors.name && <span className="studio-field-error">{fieldErrors.name}</span>}
            </label>
            <label className="studio-field">
              Role
              <input
                value={form.role}
                onChange={(e) => set({ role: e.target.value })}
                placeholder="e.g. Lead Engineer"
              />
              {fieldErrors.role && <span className="studio-field-error">{fieldErrors.role}</span>}
            </label>
            <label className="studio-field">
              Bio
              <textarea rows={4} value={form.bio} onChange={(e) => set({ bio: e.target.value })} />
            </label>
            <label className="studio-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set({ active: e.target.checked })}
              />
              Visible on site
            </label>
          </div>

          <div className="studio-form-col">
            <span className="studio-field-label">Photo</span>
            <ImageUpload
              value={form.photo_url}
              kind="founders"
              shape="portrait"
              onChange={(url) => set({ photo_url: url })}
            />
            <div className="studio-socials">
              {SOCIAL_FIELDS.map((s) => (
                <label key={s.key} className="studio-field">
                  {s.label}
                  <input
                    value={form.socials[s.key] || ''}
                    onChange={(e) => setSocial(s.key, e.target.value)}
                    placeholder="https://…"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="studio-modal-foot">
          <SaveBadge status={status} error={error} savedLabel="Saved" />
          <div className="studio-modal-foot-actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="studio-btn studio-btn--primary" disabled={status === 'saving'}>
              {founder ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
