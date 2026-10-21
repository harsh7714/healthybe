import { apiRequest, apiUrl, jsonRequest } from '@services/api'

export const reportsApi = {
  list: profileId => apiRequest(`/reports${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`),
  upload: (file, profileId) => {
    const body = new FormData()
    body.append('file', file)
    body.append('profileId', profileId)
    return apiRequest('/upload', { method: 'POST', body })
  },
  rename: (id, name) => apiRequest(`/reports/${encodeURIComponent(id)}`, jsonRequest('PATCH', { name })),
  remove: id => apiRequest(`/reports/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  fileUrl: id => apiUrl(`/reports/${encodeURIComponent(id)}/file`),
}
