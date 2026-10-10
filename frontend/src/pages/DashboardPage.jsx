import React from 'react'
import { ArrowRight, ArrowUpRight, Banknote, BadgeDollarSign, Building2, Code2, HeartHandshake, Laptop, Megaphone, PackageCheck, UsersRound, WalletCards } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable, ErrorState, formatMoney, LoadingState, PageHeading, Panel, StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { api } from '../services/api'

const departmentIcons = [Code2, HeartHandshake, BadgeDollarSign, Megaphone, Laptop, PackageCheck]

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, run } = useAsync()
  const departmentHead = user?.permission_scope === 'department'
  const employee = user?.permission_scope === 'self'

  const load = useCallback(() => run(async () => {
    const [employees, salaries, payslips, departmentResult] = await Promise.all([
      api.users({ page: 1, per_page: 5 }),
      api.salaries({ page: 1, per_page: 100 }),
      api.payslips({ page: 1, per_page: 5 }),
      user?.capabilities?.departments?.read ? api.departments() : Promise.resolve({ departments: [] }),
    ])
    return { employees, salaries, payslips, departments: departmentResult.departments || [] }
  }), [run, user])
  useEffect(() => { load().catch(() => {}) }, [load])

  if (loading && !data) return <LoadingState label="Preparing your dashboard" />
  if (error && !data) return <ErrorState error={error} onRetry={() => load().catch(() => {})} />

  const salaryRows = data?.salaries?.salaries || []
  const annualPayroll = salaryRows.reduce((sum, salary) => sum + Number(salary.current_ctc || 0), 0)
  const employeeCount = data?.employees?.meta?.total || 0
  const departments = data?.departments || []
  const canReadEmployees = Boolean(user?.capabilities?.employees?.read)
  const canReadDepartments = Boolean(user?.capabilities?.departments?.read)
  const employeeTarget = canReadEmployees && !employee ? '/employees' : '/profile'
  const salaryTarget = !employee && user?.capabilities?.salaries?.read ? '/salaries' : '/profile'
  const tableRows = (data?.employees?.users || []).slice(0, 5).map((person) => ({
    ...person,
    name: `${person.first_name} ${person.last_name}`,
    department_name: person.department?.name || '—',
  }))
  const chart = salaryRows.slice(0, 7).map((salary) => ({
    name: `Emp. ${salary.user_id}`,
    amount: Number(salary.current_ctc || 0),
  }))
  const greeting = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="page-stack">
      <PageHeading eyebrow={greeting.toUpperCase()} title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || 'there'}`} description={employee ? 'Here’s a snapshot of your salary and latest payslip.' : departmentHead ? 'A quick view of your department and team.' : 'Here’s what’s happening across your people operations.'} actions={!employee && <Link to="/employees" className="button button--primary"><UsersRound size={16} /> View employees</Link>} />
      <div className="stat-grid">
        <StatCard label={employee ? 'My profile' : departmentHead ? 'Team members' : 'Total employees'} value={employee ? 'Active' : employeeCount.toLocaleString()} caption={employee ? 'Your employment status' : 'Within your access scope'} icon={UsersRound} tone="blue" to={employeeTarget} />
        <StatCard label={employee ? 'Current annual salary' : 'Current salary'} value={employee ? (salaryRows[0] ? formatMoney(salaryRows[0].current_ctc) : '—') : formatMoney(annualPayroll)} caption={employee ? 'Annual CTC' : 'Current records loaded'} icon={WalletCards} tone="purple" to={salaryTarget} />
        <StatCard label="Payslips" value={data?.payslips?.meta?.total ?? data?.payslips?.payslips?.length ?? 0} caption="Available statements" icon={Banknote} tone="green" to={user?.capabilities?.payslips?.read ? '/payslips' : undefined} />
        <StatCard label="Departments" value={canReadDepartments ? departments.length : '—'} caption={departmentHead ? 'Your department' : 'Visible departments'} icon={Building2} tone="amber" to={canReadDepartments ? '/departments' : undefined} />
      </div>
      {departments.length > 0 && <section className="dashboard-departments" aria-label="Departments">
        {departments.map((department, index) => {
          const Icon = departmentIcons[index % departmentIcons.length]
          return <Link to={`/departments/${department.id}`} className="department-card dashboard-department-card" key={department.id}>
            <div className={`department-symbol department-symbol--${index % 6}`}><Icon size={19} /></div><span className="department-arrow"><ArrowRight size={16} /></span>
            <h2>{department.name}</h2><p>{department.description || 'Department overview and team members'}</p>
            <span className="department-card-meta"><span>{department.department_head?.name || 'Head unassigned'}</span><strong>{department.employee_count ?? 0} employees</strong></span>
          </Link>
        })}
      </section>}
      <div className="dashboard-grid">
        <Panel title={employee ? 'My salary snapshot' : 'Salary overview'} subtitle="Current compensation records" action={<Link className="text-link" to={employee ? `/salary-revisions?user=${user?.id}` : '/salaries'}>View details <ArrowRight size={15} /></Link>} className="chart-panel">
          {chart.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={244}><BarChart data={chart} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8a91a1', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a91a1', fontSize: 11 }} tickFormatter={(value) => formatMoney(value)} /><Tooltip formatter={(value) => formatMoney(value)} cursor={{ fill: '#f5f6fb' }} /><Bar dataKey="amount" fill="#6258d9" radius={[5, 5, 0, 0]} maxBarSize={34} /></BarChart></ResponsiveContainer></div> : <div className="chart-placeholder"><span className="chart-trend"><ArrowUpRight size={15} /> Salary data will appear here</span><div className="chart-placeholder-bars">{[40, 65, 48, 80, 54, 72, 60, 91, 66, 82, 74, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><span className="muted">No salary records are available in this view.</span></div>}
          <div className="chart-legend"><span><i /> Current annual CTC</span><span className="chart-update">Updated just now</span></div>
        </Panel>
        <Panel title="Recent payslips" subtitle="Latest monthly statements" action={<Link className="text-link" to="/payslips">See all <ArrowRight size={15} /></Link>}>
          {data?.payslips?.payslips?.length ? <div className="payslip-list">{data.payslips.payslips.slice(0, 4).map((slip) => <Link to={`/payslips/${slip.id}`} key={slip.id} className="payslip-row"><span className="payslip-icon"><Banknote size={17} /></span><span className="payslip-row-copy"><strong>{new Date(Number(slip.year), Number(slip.month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><small>Net pay statement</small></span><span className="payslip-amount">{formatMoney(slip.net_pay)}</span><ArrowRight size={15} className="row-arrow" /></Link>)}</div> : <div className="compact-empty"><span className="empty-state-mark">—</span><strong>No payslips yet</strong><small>New statements will show here.</small></div>}
        </Panel>
      </div>
      <Panel title="People at a glance" subtitle="A small preview of your employee directory" action={<Link className="text-link" to="/employees">Open directory <ArrowRight size={15} /></Link>}>
        <DataTable rows={tableRows} emptyTitle="No employees in this view" emptyDescription="Employees within your permitted scope appear here." columns={[
          { key: 'name', label: 'EMPLOYEE', render: (person) => <Link to={`/employees/${person.id}`} className="person-cell"><span className="avatar avatar--table">{person.first_name?.[0]}{person.last_name?.[0]}</span><span><strong>{person.name}</strong><small>{person.email}</small></span></Link> },
          { key: 'employee_code', label: 'EMPLOYEE ID' },
          { key: 'department_name', label: 'DEPARTMENT' },
          { key: 'employment_status', label: 'STATUS', render: (person) => <span className={`status-pill status-pill--${person.employment_status === 'active' ? 'green' : 'gray'}`}><i />{person.employment_status}</span> },
        ]} />
      </Panel>
    </div>
  )
}
