let csrfTokenPromise = null;

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch('/api/csrf-token', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no csrf token'))))
      .then((data) => data.token)
      .catch(() => {
        csrfTokenPromise = null;
        return null;
      });
  }
  return csrfTokenPromise;
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (WRITE_METHODS.has(method)) {
    const token = await getCsrfToken();
    if (token) headers['X-CSRFToken'] = token;
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.errors = body.errors || {};
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const getJSON = (path) => apiFetch(path);
export const postJSON = (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) });
export const putJSON = (path, data) => apiFetch(path, { method: 'PUT', body: JSON.stringify(data) });
export const deleteReq = (path) => apiFetch(path, { method: 'DELETE' });

// Multipart image upload. `kind` is 'founders' or 'projects'. Returns { url }.
export async function uploadImage(file, kind) {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  return apiFetch('/api/admin/upload', { method: 'POST', body: form });
}
