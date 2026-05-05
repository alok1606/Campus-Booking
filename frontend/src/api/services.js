import api from './axios';

export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
};

export const eventsAPI = {
  list: (p) => api.get('/events', { params: p }),
  get: (id) => api.get(`/events/${id}`),
  create: (d) => api.post('/events', d),
  update: (id, d) => api.put(`/events/${id}`, d),
  delete: (id) => api.delete(`/events/${id}`),
  submit: (id) => api.patch(`/events/${id}/submit`),
  review: (id, d) => api.patch(`/events/${id}/review`, d),
};

export const resourcesAPI = {
  list: (p) => api.get('/resources', { params: p }),
  get: (id) => api.get(`/resources/${id}`),
  create: (d) => api.post('/resources', d),
  update: (id, d) => api.put(`/resources/${id}`, d),
  delete: (id) => api.delete(`/resources/${id}`),
  availability: (id, date) => api.get(`/resources/${id}/availability`, { params: { date } }),
};

export const bookingsAPI = {
  list: (p) => api.get('/bookings', { params: p }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (d) => api.post('/bookings', d),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id, d) => api.patch(`/bookings/${id}/reject`, d),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  export: () => api.get('/bookings/export', { responseType: 'blob' }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  auditLogs: (p) => api.get('/admin/audit-logs', { params: p }),
};

export const reportsAPI = {
  get: (p) => api.get('/reports', { params: p }),
  exportCSV: (p) => api.get('/reports/export', { params: p, responseType: 'blob' }),
};
