const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return res.blob();
  }

  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  getSchema: () => request('/schema'),

  // Entity CRUD helpers
  listEntity: (entityName, params) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    const qs = new URLSearchParams(params).toString();
    return request(`/${slug}?${qs}`);
  },

  getEntity: (entityName, id) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    return request(`/${slug}/${id}`);
  },

  createEntity: (entityName, data) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    return request(`/${slug}`, { method: 'POST', body: JSON.stringify(data) });
  },

  updateEntity: (entityName, id, data) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    return request(`/${slug}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteEntity: (entityName, id) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    return request(`/${slug}/${id}`, { method: 'DELETE' });
  },

  exportCsv: (entityName, params) => {
    const slug = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 's';
    const qs = new URLSearchParams(params).toString();
    return request(`/${slug}/export?${qs}`);
  },
};
