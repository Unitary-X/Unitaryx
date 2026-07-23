import { useRef, useState } from 'react';
import { uploadImage } from '../../lib/api';

export default function ImageUpload({ value, kind, onChange, shape = 'portrait' }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | error
  const [message, setMessage] = useState('');

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      const { url } = await uploadImage(file, kind);
      onChange(url);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Upload failed');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="img-upload">
      <div className={`img-preview img-preview--${shape}`}>
        {value ? (
          <img src={value} alt="Preview" />
        ) : (
          <span className="img-placeholder">No image</span>
        )}
        {status === 'uploading' && <span className="img-uploading">Uploading…</span>}
      </div>
      <div className="img-upload-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          hidden
        />
        <button type="button" className="studio-btn" onClick={pick} disabled={status === 'uploading'}>
          {value ? 'Replace image' : 'Upload image'}
        </button>
        {value && (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={() => onChange('')}>
            Remove
          </button>
        )}
        {status === 'error' && <span className="img-error">{message}</span>}
      </div>
    </div>
  );
}
