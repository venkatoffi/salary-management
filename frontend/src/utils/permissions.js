export function roleIs(user, ...names) {
  return names.includes(user?.role_name)
}

export function can(user, resource, action = 'read') {
  return Boolean(user?.capabilities?.[resource]?.[action])
}

export function navigationFor(user) {
  const privileged = roleIs(user, 'Chiefs', 'HR Manager')
  const items = [{ label: 'Overview', to: '/', icon: 'LayoutDashboard', show: true }]
  if (privileged || roleIs(user, 'Department Heads')) {
    items.push({ label: 'Employees', to: '/employees', icon: 'UsersRound', show: can(user, 'employees') })
  }
  if (privileged || roleIs(user, 'Department Heads')) {
    items.push({ label: 'Departments', to: '/departments', icon: 'Building2', show: can(user, 'departments') })
  }
  if (privileged || roleIs(user, 'Department Heads')) {
    items.push({ label: 'Salaries', to: '/salaries', icon: 'WalletCards', show: can(user, 'salaries') })
  }
  items.push({ label: 'Salary history', to: '/salary-revisions', icon: 'History', show: can(user, 'salary_revisions') })
  items.push({ label: 'Payslips', to: '/payslips', icon: 'ReceiptText', show: can(user, 'payslips') })
  items.push({ label: 'My profile', to: '/profile', icon: 'CircleUserRound', show: true })
  return items.filter((item) => item.show)
}
