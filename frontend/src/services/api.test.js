import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, setUnauthorizedHandler, tokenStorage } from './api'

describe('API authentication', () => {
  afterEach(() => setUnauthorizedHandler(() => {}))

  it('sends the raw token and clears it when a protected request returns 401', async () => {
    const expireSession = vi.fn()
    tokenStorage.set('signed.jwt.value')
    setUnauthorizedHandler(expireSession)
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(api.users({ page: 2 })).rejects.toMatchObject({ status: 401, message: 'Invalid token' })

    const [url, options] = fetch.mock.calls[0]
    expect(url.toString()).toContain('/api/v1/users?page=2')
    expect(options.headers.Authorization).toBe('signed.jwt.value')
    expect(expireSession).toHaveBeenCalledOnce()
    expect(tokenStorage.get()).toBeNull()
  })

  it('stores the login token and does not send authorization on login', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ auth_token: 'new.jwt', user: { id: 1 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await api.login('person@example.test', 'secret')

    const [url, options] = fetch.mock.calls[0]
    expect(url.toString()).toBe('http://localhost:3000/login')
    expect(options.method).toBe('POST')
    expect(options.headers).not.toHaveProperty('Authorization')
    expect(tokenStorage.get()).toBe('new.jwt')
  })
})
