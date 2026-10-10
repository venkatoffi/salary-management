import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import DashboardLayout from '../layouts/DashboardLayout'
import { api } from '../services/api'
import { DepartmentsPage } from './DepartmentPages'
import { EmployeeCreateDrawer, EmployeesPage } from './EmployeePages'
import { PayslipDetailDrawer } from './PayslipPages'
import { ProfilePage } from './ProfilePage'
import { SalaryDetailDrawer } from './SalaryPages'
import DashboardPage from './DashboardPage'

vi.mock('../services/api', () => ({
  api: {
    currentUser: vi.fn(),
    users: vi.fn(),
    user: vi.fn(),
    createUser: vi.fn(),
    departments: vi.fn(),
    roles: vi.fn(),
    salaries: vi.fn(),
    salary: vi.fn(),
    payslips: vi.fn(),
    payslip: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
  setUnauthorizedHandler: vi.fn(),
  tokenStorage: { get: vi.fn(() => 'test.jwt'), clear: vi.fn(), set: vi.fn() },
}))

const manager = {
  id: 1, name: 'Casey Chief', email: 'casey@example.test', role_name: 'Chiefs', role_id: 1,
  department_id: 1, permission_scope: 'all',
  capabilities: Object.fromEntries(['employees', 'departments', 'salaries', 'salary_revisions', 'payslips']
    .map((resource) => [resource, { read: true, manage: true }])),
}

const employeeProfile = {
  id: 8, first_name: 'Alex', last_name: 'Employee', name: 'Alex Employee',
  email: 'alex@example.test', sex: 'Female', role_name: 'Employees', role: { id: 4, name: 'Employees' },
  job_title: 'Analyst', employee_code: 'EMP-008', employment_status: 'active',
  country_code: 'IN', city: 'Bengaluru', state: 'Karnataka', date_of_joining: '2022-04-01',
  last_working_date: null, department: { id: 2, name: 'Finance' },
  department_head: { id: 2, name: 'Harper Head' },
  salary: { id: 9, current_ctc: '1200000.0', currency_code: 'INR', effective_from: '2025-04-01' },
}

function renderInApp(element, { authenticated = false, currentUser = manager } = {}) {
  if (authenticated) {
    sessionStorage.setItem('salary-management.auth-token', 'test.jwt')
    if (currentUser) api.currentUser.mockResolvedValue({ user: currentUser })
  }
  return render(<BrowserRouter><ToastProvider><AuthProvider>{element}</AuthProvider></ToastProvider></BrowserRouter>)
}

describe('employee, department, salary, payslip and profile flows', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    api.currentUser.mockResolvedValue({ user: manager })
  })

  it('opens the employee preview from the table eye action', async () => {
    api.departments.mockResolvedValue({ departments: [] })
    api.users.mockResolvedValue({ users: [employeeProfile], meta: { total: 1, page: 1, per_page: 10 } })
    api.user.mockResolvedValue({ user: employeeProfile })
    renderInApp(<EmployeesPage />, { authenticated: true })

    await screen.findByText('Alex Employee')
    const viewButton = screen.getByRole('button', { name: 'View Alex Employee' })
    expect(viewButton).toHaveAttribute('title', 'View Alex Employee')
    expect(viewButton.tabIndex).toBe(0)
    fireEvent.click(viewButton)

    expect(await screen.findByRole('dialog', { name: 'Employee details' })).toBeInTheDocument()
    const personal = screen.getByRole('region', { name: 'Personal Information' })
    expect(within(personal).getByText('First name')).toBeInTheDocument()
    expect(within(personal).getByText('Alex')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Employment' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Location' })).toBeInTheDocument()
    const department = screen.getByRole('region', { name: 'Department & Reporting' })
    expect(within(department).getByText('Harper Head')).toBeInTheDocument()
    expect(screen.getByText('Karnataka')).toBeInTheDocument()
    expect(screen.getByText('₹12,00,000.00')).toBeInTheDocument()
    expect(personal.querySelector('.employee-detail-row')).toHaveClass('employee-detail-row')
    expect(viewButton).toHaveClass('table-icon-link')
  })

  it('uses a neutral inactive badge and displays the last working date', async () => {
    const inactive = { ...employeeProfile, employment_status: 'inactive', last_working_date: '2026-02-01' }
    api.departments.mockResolvedValue({ departments: [] })
    api.users.mockResolvedValue({ users: [inactive], meta: { total: 1, page: 1, per_page: 10 } })
    api.user.mockResolvedValue({ user: inactive })
    renderInApp(<EmployeesPage />, { authenticated: true })

    fireEvent.click(await screen.findByRole('button', { name: 'View Alex Employee' }))
    const employment = await waitFor(() => {
      const section = document.querySelector('section[aria-label="Employment"]')
      expect(section).not.toBeNull()
      return section
    })
    expect(within(employment).getByText('Inactive')).toHaveClass('status-pill--gray')
    expect(within(employment).getByText('2026-02-01')).toBeInTheDocument()
  })

  it('creates an employee from the validated side drawer', async () => {
    api.departments.mockResolvedValue({ departments: [{ id: 3, name: 'Engineering' }] })
    api.roles.mockResolvedValue({ roles: [{ id: 4, name: 'Employees' }] })
    api.createUser.mockResolvedValue({ user: employeeProfile })
    const onCreated = vi.fn()
    const notify = vi.fn()
    render(<EmployeeCreateDrawer open onClose={vi.fn()} onCreated={onCreated} notify={notify} />)

    await screen.findByRole('option', { name: 'Engineering' })
    const values = {
      'First name': 'Taylor', 'Last name': 'Reed', Email: 'taylor@example.test',
      'Employee code': 'EMP-100', 'Joining date': '2026-10-10', 'Temporary password': 'test-password',
      'Confirm password': 'test-password',
    }
    Object.entries(values).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(new RegExp(label, 'i')), { target: { value } }))
    fireEvent.change(screen.getByLabelText('Role *'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Department *'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create employee' }))

    await waitFor(() => expect(api.createUser).toHaveBeenCalled())
    expect(api.createUser).toHaveBeenCalledWith(expect.objectContaining({
      first_name: 'Taylor', last_name: 'Reed', role_id: 4, department_id: 3,
      country_code: 'IN', employee_code: 'EMP-100',
    }))
    expect(notify).toHaveBeenCalledWith('Employee created successfully.')
    expect(onCreated).toHaveBeenCalled()
  })

  it('shows department head and employee-count information on department cards', async () => {
    api.departments.mockResolvedValue({ departments: [{
      id: 2, name: 'Finance', description: 'Finance operations',
      department_head: { id: 5, name: 'Harper Head' }, employee_count: 42,
    }] })
    render(<BrowserRouter><DepartmentsPage /></BrowserRouter>)

    const card = await screen.findByRole('link', { name: /Finance/ })
    expect(within(card).getByText('Finance operations')).toBeInTheDocument()
    expect(within(card).getByText('Harper Head')).toBeInTheDocument()
    expect(within(card).getByText('42 employees')).toBeInTheDocument()
  })

  it('renders newest-first salary history with hike, approver and reason', async () => {
    api.salary.mockResolvedValue({
      salary: { id: 3, user_id: 8, current_ctc: '1300000.0', effective_from: '2026-04-01', currency_code: 'INR', user: { name: 'Alex Employee', employee_code: 'EMP-008', department: { name: 'Finance' }, date_of_joining: '2022-04-01' } },
      salary_revisions: [{ id: 7, old_ctc: '1200000.0', new_ctc: '1300000.0', revision_date: '2026-04-01', approved_by_id: 1, approved_by_name: 'Casey Chief', reason: 'Annual review', increment_percentage: 8.33 }],
    })
    renderInApp(<SalaryDetailDrawer id={3} open onClose={vi.fn()} />, { authenticated: true })

    expect(await screen.findByText('Annual review')).toBeInTheDocument()
    expect(screen.getByText('Casey Chief', { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/April 2026/)).toBeInTheDocument()
    expect(screen.getByText(/8\.33%/)).toBeInTheDocument()
  })

  it('shows complete payslip details in the drawer', async () => {
    api.payslip.mockResolvedValue({ payslip: {
      id: 11, user_id: 8, month: 9, year: 2026,
      user: { name: 'Alex Employee', employee_code: 'EMP-008', department: { name: 'Finance' } },
      total_earnings: '100000.0', total_deduction: '12000.0', net_pay: '88000.0',
    } })
    render(<PayslipDetailDrawer id={11} open onClose={vi.fn()} />)

    expect(await screen.findByText('Alex Employee')).toBeInTheDocument()
    expect(screen.getByText('EMP-008 · Finance')).toBeInTheDocument()
    expect(screen.getByText('₹88,000.00')).toBeInTheDocument()
    expect(screen.getByText('₹12,000.00')).toBeInTheDocument()
  })

  it('edits only permitted personal fields in the profile drawer', async () => {
    api.currentUser.mockResolvedValue({ user: employeeProfile })
    api.updateCurrentUser.mockResolvedValue({ user: { ...employeeProfile, first_name: 'Alexandra', name: 'Alexandra Employee' } })
    sessionStorage.setItem('salary-management.auth-token', 'test.jwt')
    renderInApp(<ProfilePage />, { authenticated: true, currentUser: null })

    await screen.findByRole('heading', { name: 'My profile' })
    await screen.findByText('alex@example.test')
    expect(screen.getByRole('region', { name: 'Profile summary' })).toHaveTextContent('Alex Employee')
    expect(screen.getByRole('region', { name: 'Profile summary' })).toHaveTextContent('Employees')
    expect(screen.getByRole('region', { name: 'Profile summary' })).toHaveTextContent('alex@example.test')
    expect(screen.getByText('Active')).toHaveClass('status-pill--green')
    const personalInformation = screen.getByRole('region', { name: 'Personal Information' })
    expect(within(personalInformation).getByText('First Name')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Alex')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Last Name')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Employee')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Email')).toBeInTheDocument()
    expect(within(personalInformation).getByText('alex@example.test')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Sex')).toBeInTheDocument()
    expect(within(personalInformation).getByText('Female')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Employment Information' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Location' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Department & Reporting Manager' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit personal details' }))
    expect(await screen.findByRole('dialog', { name: 'Edit personal details' })).toBeInTheDocument()
    expect(screen.getByLabelText(/First name/)).toHaveValue('Alex')
    expect(screen.getByLabelText(/Last name/)).toHaveValue('Employee')
    expect(screen.queryByLabelText('Role', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Department', { exact: true })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Alexandra' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))

    await waitFor(() => expect(api.updateCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Alexandra' })))
    expect(await screen.findByText('Alexandra Employee')).toBeInTheDocument()
  })

  it('navigates overview cards through router links and keeps sidebar selection in sync', async () => {
    sessionStorage.setItem('salary-management.auth-token', 'test.jwt')
    api.currentUser.mockResolvedValue({ user: manager })
    api.users.mockResolvedValue({ users: [], meta: { total: 12, page: 1, per_page: 5 } })
    api.salaries.mockResolvedValue({ salaries: [], meta: { total: 20, page: 1, per_page: 100 } })
    api.payslips.mockResolvedValue({ payslips: [], meta: { total: 30, page: 1, per_page: 5 } })
    api.departments.mockResolvedValue({ departments: [
      { id: 1, name: 'Engineering', employee_count: 12, department_head: { name: 'Harper Head' } },
    ] })
    render(<MemoryRouter initialEntries={['/']}><ToastProvider><AuthProvider><Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<h1>Employees page</h1>} />
        <Route path="salaries" element={<h1>Salaries page</h1>} />
        <Route path="payslips" element={<h1>Payslips page</h1>} />
        <Route path="departments" element={<h1>Departments page</h1>} />
      </Route>
    </Routes></AuthProvider></ToastProvider></MemoryRouter>)

    const employeesCard = await screen.findByRole('link', { name: 'Total employees: 12' })
    expect(employeesCard).toHaveAttribute('href', '/employees')
    expect(screen.getByRole('link', { name: /Current salary:/ })).toHaveAttribute('href', '/salaries')
    expect(screen.getByRole('link', { name: 'Payslips: 30' })).toHaveAttribute('href', '/payslips')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Departments: 1' })).toHaveAttribute('href', '/departments'))

    fireEvent.click(employeesCard)
    expect(await screen.findByRole('heading', { name: 'Employees page' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveClass('nav-link--active')
  })
})
