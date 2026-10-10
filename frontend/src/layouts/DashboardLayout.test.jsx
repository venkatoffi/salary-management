import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../context/ToastContext'
import DashboardLayout from './DashboardLayout'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 7, name: 'Venkat Balaji', email: 'venkat@example.test', role_name: 'Chiefs' },
    logout: vi.fn(),
  }),
}))

function renderLayout(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><Routes>
    <Route element={<DashboardLayout />}>
      <Route index element={<h1>Overview</h1>} />
      <Route path="profile" element={<h1>My Profile page</h1>} />
    </Route>
  </Routes></ToastProvider></MemoryRouter>)
}

describe('dashboard profile, help, and notifications', () => {
  afterEach(() => cleanup())

  it('navigates to My Profile from the bottom user section and marks it active', async () => {
    renderLayout()
    const sidebar = screen.getByRole('complementary')
    const profileLink = within(sidebar).getByRole('link', { name: 'View profile for Venkat Balaji' })
    expect(profileLink).toHaveTextContent('Venkat Balaji')
    expect(profileLink).toHaveTextContent('Chiefs')
    expect(within(sidebar).queryByRole('link', { name: /My Profile/i })).not.toBeInTheDocument()
    fireEvent.click(profileLink)

    expect(await screen.findByRole('heading', { name: 'My Profile page' })).toBeInTheDocument()
    expect(profileLink).toHaveAttribute('aria-current', 'page')
    expect(profileLink).toHaveClass('sidebar-user-link--active')
  })

  it('navigates to the same profile from the top-right profile control', async () => {
    renderLayout()
    fireEvent.click(document.querySelector('.topbar-profile'))

    expect(await screen.findByRole('heading', { name: 'My Profile page' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View profile for Venkat Balaji' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the help drawer, validates required fields, and simulates a successful request', async () => {
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: /Open help center/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Help Center' })
    const form = dialog.querySelector('form')

    fireEvent.submit(form)
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Enter a subject and message')

    fireEvent.change(within(dialog).getByLabelText('Subject *'), { target: { value: 'Payslip question' } })
    fireEvent.change(within(dialog).getByLabelText('Message *'), { target: { value: 'Could you help me find my latest payslip?' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Your help request was sent.')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Help Center' })).not.toBeInTheDocument())
  })

  it('opens the notifications popover and marks all ten items as read', async () => {
    renderLayout()
    const button = screen.getByRole('button', { name: 'Notifications, 10 unread' })
    fireEvent.click(button)

    const dialog = screen.getByRole('dialog', { name: 'Notifications' })
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(10)
    expect(within(dialog).getByText(/September payslips were generated/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark all as read' }))

    expect(screen.getByRole('button', { name: 'Notifications, no unread notifications' })).toBeInTheDocument()
    expect(within(dialog).getByText('All caught up')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
  })
})
