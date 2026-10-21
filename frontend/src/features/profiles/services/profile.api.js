import { apiRequest, jsonRequest } from '@services/api'

export const profilesApi = {
  list: () => apiRequest('/profiles'),
  create: data => apiRequest('/profiles', jsonRequest('POST', data)),
  update: (id, data) =>
    apiRequest(`/profiles/${encodeURIComponent(id)}`, jsonRequest('PATCH', data)),
  remove: id => apiRequest(`/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
