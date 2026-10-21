const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export function apiUrl(path) {
  return `${baseUrl}${path}`
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), { credentials: 'include', ...options })
  const type = response.headers.get('content-type') || ''
  const payload = type.includes('application/json') ? await response.json() : null
  if (!response.ok)
    throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`)
  return payload
}

export const jsonRequest = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
