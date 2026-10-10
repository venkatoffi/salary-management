import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import AppRoutes from './AppRoutes'

function renderApp(path = '/') {
  window.history.replaceState({}, '', path)
  return render(<BrowserRouter><ToastProvider><AuthProvider><AppRoutes /></AuthProvider></ToastProvider></BrowserRouter>)
}

describe('protected routing and authorization-aware navigation', () => {
  it('redirects an unauthenticated visitor to login', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: /sign in to your/i })).toBeInTheDocument()
  })

  it('renders employee navigation from the restored session, without HR-only links', async () => {
    sessionStorage.setItem('salary-management.auth-token', 'raw.jwt')
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      user: {
        id: 8, name: 'Alex Employee', email: 'alex@example.test', role_name: 'Employees',
        role_id: 4, department_id: 2, permission_scope: 'self',
        capabilities: {
          employees: { read: true, manage: false }, departments: { read: false, manage: false },
          salaries: { read: true, manage: false }, salary_revisions: { read: true, manage: false },
          payslips: { read: true, manage: false },
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      users: [], meta: { total: 1, page: 1, per_page: 5 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ salaries: [], meta: { total: 0, page: 1, per_page: 100 } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ payslips: [], meta: { total: 0, page: 1, per_page: 5 } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))

    renderApp('/')

    await screen.findByRole('link', { name: 'Payslips' })
    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByRole('link', { name: 'View profile for Alex Employee' })).toBeInTheDocument()
    expect(within(sidebar).queryByRole('link', { name: /My profile/i })).not.toBeInTheDocument()
    expect(sidebar.querySelectorAll('a[href="/profile"]')).toHaveLength(1)
    expect(document.querySelector('.topbar-profile')).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('link', { name: 'Departments' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Employees' })).not.toBeInTheDocument()
    const [url, options] = fetch.mock.calls[0]
    expect(url.toString()).toBe('http://localhost:3000/current_user')
    expect(options.headers.Authorization).toBe('raw.jwt')
  })
})
