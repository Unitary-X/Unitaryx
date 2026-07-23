import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getJSON, apiFetch } from '../../lib/api';
import './Feedback.css';

function Stars({ value, onChange }) {
  const interactive = typeof onChange === 'function';
  return (
    <div className={`stars ${interactive ? 'stars--interactive' : ''}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= value ? 'on' : ''}`}
          onClick={interactive ? () => onChange(n) : undefined}
          tabIndex={interactive ? 0 : -1}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [posts, setPosts] = useState([]);
  const [session, setSession] = useState({ loading: true, authenticated: false });
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ state: 'idle', text: '' });

  useEffect(() => {
    getJSON('/api/feedback')
      .then((d) => setPosts(d.feedback))
      .catch(() => setPosts([]));
    getJSON('/api/auth/session')
      .then((d) => setSession({ loading: false, authenticated: d.authenticated }))
      .catch(() => setSession({ loading: false, authenticated: false }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting', text: '' });
    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, message }),
      });
      setPosts((p) => [res.post, ...p]);
      setMessage('');
      setRating(5);
      setStatus({ state: 'ok', text: 'Thanks for your feedback — it is now live below.' });
    } catch (err) {
      setStatus({ state: 'error', text: err.message || 'Could not post feedback.' });
    }
  };

  return (
    <section className="feedback-section" id="feedback">
      <div className="section-inner">
        <span className="eyebrow">Feedback corner</span>
        <h2 className="section-title">What people say — and your turn to add to it.</h2>

        <div className="feedback-grid">
          <div className="feedback-form-col">
            {session.loading ? null : session.authenticated ? (
              <form className="feedback-form glass" onSubmit={submit}>
                <label className="feedback-field">
                  Your rating
                  <Stars value={rating} onChange={setRating} />
                </label>
                <label className="feedback-field">
                  Your feedback
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    minLength={4}
                    maxLength={1500}
                    placeholder="Share your experience working with Unitary X…"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="feedback-submit"
                  disabled={status.state === 'submitting'}
                >
                  {status.state === 'submitting' ? 'Posting…' : 'Post public feedback'}
                </button>
                {status.state === 'ok' && <p className="feedback-ok">{status.text}</p>}
                {status.state === 'error' && <p className="feedback-err">{status.text}</p>}
              </form>
            ) : (
              <div className="feedback-form glass feedback-locked">
                <p>All visitors can read feedback. Log in to post your own for everyone to see.</p>
                <a className="feedback-submit" href="/login">
                  Log in to post
                </a>
              </div>
            )}
          </div>

          <div className="feedback-list">
            {posts.length === 0 ? (
              <p className="feedback-empty">Be the first to leave feedback.</p>
            ) : (
              posts.map((p, i) => (
                <motion.article
                  key={p.id}
                  className="feedback-card glass"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), type: 'spring', stiffness: 240, damping: 26 }}
                >
                  <div className="feedback-card-head">
                    <span className="feedback-author">{p.author_name}</span>
                    <Stars value={p.rating} />
                  </div>
                  <p className="feedback-message">{p.message}</p>
                  <span className="feedback-date">{p.created_at}</span>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
