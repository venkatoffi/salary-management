import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

const { login, notify } = vi.hoisted(() => ({ login: vi.fn(), notify: vi.fn() }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login, user: null, loading: false }),
}))
vi.mock('../context/ToastContext', () => ({ useToast: () => notify }))

describe('login form', () => {
  beforeEach(() => { login.mockReset(); notify.mockReset() })

  it('submits credentials and reports an authentication error', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'))
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alex@example.test' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(login).toHaveBeenCalledWith('alex@example.test', 'wrong-password'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  })
})
