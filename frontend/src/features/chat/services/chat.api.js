import { apiRequest } from '@services/api'

export const chatApi = {
  send: ({ message, profileId, history, reportId, file }) => {
    const body = new FormData()
    body.append('message', message)
    body.append('profileId', profileId)
    body.append('history', JSON.stringify(history || []))
    if (reportId) body.append('reportId', reportId)
    if (file) body.append('file', file)
    return apiRequest('/chat', { method: 'POST', body })
  },
}
