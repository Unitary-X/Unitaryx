import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '../../lib/api';

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreFor, setRestoreFor] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [notice, setNotice] = useState('');

  const load = () =>
    getJSON('/api/admin/db-backups')
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load backups'));

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading backups…</p>;

  const create = async () => {
    setBusy(true);
    setNotice('');
    try {
      const res = await postJSON('/api/admin/db-backups', {});
      setNotice(`Backup created: ${res.filename} (${res.row_count} rows).`);
      await load();
    } catch (err) {
      setNotice(err.message || 'Could not create backup.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      await postJSON('/api/admin/db-backups/restore', {
        backup_file: restoreFor,
        confirm_restore: confirmText,
      });
      setNotice(`Restore completed from ${restoreFor}.`);
      setRestoreFor(null);
      setConfirmText('');
      await load();
    } catch (err) {
      window.alert(err.message || 'Restore failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Database backups</h2>
          <p className="admin-section-note">{data.backups.length} backups on disk</p>
        </div>
        <button type="button" className="studio-btn studio-btn--primary" onClick={create} disabled={busy}>
          Create backup
        </button>
      </div>

      {notice && <p className="leads-notice">{notice}</p>}

      <div className="admin-card glass restore-warning">
        <strong>Restore overwrites current data.</strong> It replaces the tables captured in the chosen backup with
        the file's contents. This cannot be undone — create a fresh backup first.
      </div>

      {data.backups.length === 0 ? (
        <div className="admin-empty glass">
          <p className="admin-empty-title">No backups yet</p>
          <p className="admin-muted">Create your first backup above.</p>
        </div>
      ) : (
        <div className="admin-card glass">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Created (UTC)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.backups.map((b) => (
                  <tr key={b.filename}>
                    <td className="admin-mono">{b.filename}</td>
                    <td className="admin-mono">{fmtSize(b.size_bytes)}</td>
                    <td className="admin-mono">{b.modified}</td>
                    <td>
                      <div className="admin-row-actions">
                        <a className="studio-btn studio-btn--ghost" href={`/admin/db-backups/download/${b.filename}`}>
                          Download
                        </a>
                        <button
                          type="button"
                          className="studio-btn studio-btn--danger"
                          onClick={() => {
                            setRestoreFor(b.filename);
                            setConfirmText('');
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {restoreFor && (
        <div className="studio-overlay" onClick={() => setRestoreFor(null)} role="presentation">
          <div className="studio-modal glass-strong" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-head">
              <h3>Restore backup</h3>
              <button type="button" className="studio-modal-close" onClick={() => setRestoreFor(null)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="admin-muted">
              You are about to overwrite current data with <strong>{restoreFor}</strong>. Type{' '}
              <strong>RESTORE</strong> to confirm.
            </p>
            <label className="studio-field">
              Confirmation
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESTORE" />
            </label>
            <div className="studio-modal-foot">
              <div className="studio-modal-foot-actions">
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setRestoreFor(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--danger"
                  onClick={restore}
                  disabled={busy || confirmText.trim().toUpperCase() !== 'RESTORE'}
                >
                  Restore now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
