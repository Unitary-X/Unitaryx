import { useEffect, useState } from 'react';
import ScrollPanel from '../layout/ScrollPanel';
import MagneticButton from '../common/MagneticButton';
import { apiFetch, getJSON } from '../../lib/api';
import './Contact.css';

const SERVICES = ['web', 'software', 'hardware'];

const INITIAL_FORM = { name: '', email: '', phone: '', service: '', deadline: '', message: '' };

export default function Contact() {
  const [session, setSession] = useState({ loading: true, authenticated: false });
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ state: 'idle', message: '', errors: {} });

  useEffect(() => {
    getJSON('/api/auth/session')
      .then((data) => setSession({ loading: false, authenticated: data.authenticated }))
      .catch(() => setSession({ loading: false, authenticated: false }));
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting', message: '', errors: {} });
    try {
      const data = await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify(form) });
      if (data.success) {
        setStatus({ state: 'success', message: data.message, errors: {} });
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      const errors = err.errors || {};
      setStatus({ state: 'error', message: err.message || 'Something went wrong.', errors });
    }
  };

  return (
    <ScrollPanel index={5} id="contact">
      <div className="panel-inner contact-inner">
        <span className="eyebrow">Start a project</span>
        <h2 className="gradient-headline contact-title">Tell us what you're building.</h2>

        {session.loading ? null : !session.authenticated ? (
          <div className="contact-login-prompt glass">
            <p>Sign in to submit a project request — we'll track it on your dashboard.</p>
            <MagneticButton as="a" href="/login">
              Log in to continue
            </MagneticButton>
          </div>
        ) : (
          <form className="contact-form glass" onSubmit={submit}>
            <div className="contact-field-row">
              <label>
                Name
                <input value={form.name} onChange={update('name')} required />
                {status.errors.name && <span className="field-error">{status.errors.name}</span>}
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={update('email')} required />
                {status.errors.email && <span className="field-error">{status.errors.email}</span>}
              </label>
            </div>
            <div className="contact-field-row">
              <label>
                Phone
                <input value={form.phone} onChange={update('phone')} />
              </label>
              <label>
                Service
                <select value={form.service} onChange={update('service')} required>
                  <option value="">Select…</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                {status.errors.service && <span className="field-error">{status.errors.service}</span>}
              </label>
            </div>
            <label>
              Target deadline
              <input value={form.deadline} onChange={update('deadline')} placeholder="e.g. 6 weeks" />
            </label>
            <label>
              Project details
              <textarea rows={4} value={form.message} onChange={update('message')} required minLength={20} />
              {status.errors.message && <span className="field-error">{status.errors.message}</span>}
            </label>

            <MagneticButton type="submit" disabled={status.state === 'submitting'}>
              {status.state === 'submitting' ? 'Sending…' : 'Send request'}
            </MagneticButton>

            {status.state === 'success' && <p className="contact-status contact-status--ok">{status.message}</p>}
            {status.state === 'error' && !Object.keys(status.errors).length && (
              <p className="contact-status contact-status--error">{status.message}</p>
            )}
          </form>
        )}
      </div>
    </ScrollPanel>
  );
}
