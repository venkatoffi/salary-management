import { describe, expect, it } from 'vitest'
import { navigationFor } from './permissions'

describe('role-based navigation', () => {
  it('shows HR navigation to Chiefs and HR Managers', () => {
    const nav = navigationFor({
      role_name: 'Chiefs',
      capabilities: {
        employees: { read: true }, departments: { read: true }, salaries: { read: true },
        salary_revisions: { read: true }, payslips: { read: true },
      },
    })
    expect(nav.map((item) => item.label)).toEqual([
      'Overview', 'Employees', 'Departments', 'Salaries', 'Salary history', 'Payslips', 'My profile',
    ])
  })

  it('limits an employee to overview, salary history, payslips, and profile', () => {
    const nav = navigationFor({
      role_name: 'Employees',
      capabilities: {
        employees: { read: true }, departments: { read: false }, salaries: { read: true },
        salary_revisions: { read: true }, payslips: { read: true },
      },
    })
    expect(nav.map((item) => item.label)).toEqual(['Overview', 'Salary history', 'Payslips', 'My profile'])
  })

  it('shows department heads only department-scoped resources', () => {
    const nav = navigationFor({
      role_name: 'Department Heads',
      capabilities: {
        employees: { read: true }, departments: { read: false }, salaries: { read: true },
        salary_revisions: { read: true }, payslips: { read: true },
      },
    })
    expect(nav.map((item) => item.label)).toEqual([
      'Overview', 'Employees', 'Salaries', 'Salary history', 'Payslips', 'My profile',
    ])
  })
})
