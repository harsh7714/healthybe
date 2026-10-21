import { apiRequest, jsonRequest } from '@services/api'

export const authApi = {
  me: () => apiRequest('/auth/me'),
  register: data => apiRequest('/auth/register', jsonRequest('POST', data)),
  login: data => apiRequest('/auth/login', jsonRequest('POST', data)),
  logout: () => apiRequest('/auth/logout', jsonRequest('POST', {})),
  requestPasswordReset: email => apiRequest('/auth/forgot-password', jsonRequest('POST', { email })),
  resetPassword: data => apiRequest('/auth/reset-password', jsonRequest('POST', data)),
  deleteAccount: data => apiRequest('/auth/account', jsonRequest('DELETE', data)),
}
