const configuredBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const baseUrl = configuredBase.replace(/\/+$/, '')
const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`
const originBase = baseUrl.endsWith('/api/v1') ? baseUrl.slice(0, -7) : baseUrl
const TOKEN_KEY = 'salary-management.auth-token'
let unauthorizedHandler = () => {}

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export const tokenStorage = {
  get: () => window.sessionStorage.getItem(TOKEN_KEY),
  set: (token) => window.sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => window.sessionStorage.removeItem(TOKEN_KEY),
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(path, { method = 'GET', body, publicRequest = false, rootEndpoint = false, query } = {}) {
  const url = new URL(`${rootEndpoint ? originBase : apiBase}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) url.searchParams.set(key, value)
    })
  }

  const token = publicRequest ? null : tokenStorage.get()
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = token

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiError(error.message || 'Unable to connect to the server.')
  }

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errors = Array.isArray(payload.errors) ? payload.errors : []
    const message = payload.error || errors[0] || `Request failed (${response.status}).`
    if (response.status === 401 && token) {
      tokenStorage.clear()
      unauthorizedHandler()
    }
    throw new ApiError(message, { status: response.status, errors })
  }
  return payload
}

const userPath = (id) => `/users/${id}`

export const api = {
  login: async (email, password) => {
    const result = await request('/login', {
      method: 'POST',
      body: { email, password },
      publicRequest: true,
      rootEndpoint: true,
    })
    if (!result.auth_token) throw new ApiError('The server did not return an authentication token.')
    tokenStorage.set(result.auth_token)
    return result
  },
  logout: () => request('/logout', { method: 'DELETE', rootEndpoint: true }),
  currentUser: () => request('/current_user', { rootEndpoint: true }),
  users: (query) => request('/users', { query }),
  user: (id) => request(userPath(id)),
  createUser: (user) => request('/users', { method: 'POST', body: { user } }),
  updateUser: (id, user) => request(userPath(id), { method: 'PATCH', body: { user } }),
  departments: () => request('/departments'),
  department: (id) => request(`/departments/${id}`),
  salaries: (query) => request('/salaries', { query }),
  salary: (id) => request(`/salaries/${id}`),
  createSalary: (salary) => request('/salaries', { method: 'POST', body: { salary } }),
  updateSalary: (id, salary) => request(`/salaries/${id}`, { method: 'PATCH', body: { salary } }),
  salaryRevisions: (userId, query) => request(`/users/${userId}/salary_revisions`, { query }),
  createSalaryRevision: (userId, revision) =>
    request(`/users/${userId}/salary_revisions`, { method: 'POST', body: { salary_revision: revision } }),
  payslips: (query) => request('/payslips', { query }),
  payslip: (id) => request(`/payslips/${id}`),
}

export function apiUrl(path) {
  return `${apiBase}${path}`
}
