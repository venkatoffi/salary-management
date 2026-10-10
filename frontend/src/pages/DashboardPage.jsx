import React from 'react'
import { ArrowRight, ArrowUpRight, Banknote, Building2, UsersRound, WalletCards } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable, ErrorState, formatMoney, LoadingState, PageHeading, Panel, StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { api } from '../services/api'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, run } = useAsync()
  const departmentHead = user?.permission_scope === 'department'
  const employee = user?.permission_scope === 'self'

  const load = useCallback(() => run(async () => {
    const [employees, salaries, payslips] = await Promise.all([
      api.users({ page: 1, per_page: 5 }),
      api.salaries({ page: 1, per_page: 100 }),
      api.payslips({ page: 1, per_page: 5 }),
    ])
    return { employees, salaries, payslips }
  }), [run])
  useEffect(() => { load().catch(() => {}) }, [load])

  if (loading && !data) return <LoadingState label="Preparing your dashboard" />
  if (error && !data) return <ErrorState error={error} onRetry={() => load().catch(() => {})} />

  const salaryRows = data?.salaries?.salaries || []
  const annualPayroll = salaryRows.reduce((sum, salary) => sum + Number(salary.current_ctc || 0), 0)
  const employeeCount = data?.employees?.meta?.total || 0
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
        <StatCard label={employee ? 'My profile' : departmentHead ? 'Team members' : 'Total employees'} value={employee ? 'Active' : employeeCount.toLocaleString()} caption={employee ? 'Your employment status' : 'Within your access scope'} icon={UsersRound} tone="blue" />
        <StatCard label={employee ? 'Current annual salary' : 'Current salaries'} value={employee ? (salaryRows[0] ? formatMoney(salaryRows[0].current_ctc, salaryRows[0].currency_code) : '—') : formatMoney(annualPayroll)} caption={employee ? 'Annual CTC' : 'Current records loaded'} icon={WalletCards} tone="purple" />
        <StatCard label="Payslips" value={data?.payslips?.meta?.total ?? data?.payslips?.payslips?.length ?? 0} caption="Available statements" icon={Banknote} tone="green" />
        <StatCard label="Departments" value={departmentHead ? '1' : '—'} caption={departmentHead ? 'Your department' : 'Explore your organisation'} icon={Building2} tone="amber" />
      </div>
      <div className="dashboard-grid">
        <Panel title={employee ? 'My salary snapshot' : 'Salary overview'} subtitle="Current compensation records" action={<Link className="text-link" to={employee ? `/salary-revisions?user=${user?.id}` : '/salaries'}>View details <ArrowRight size={15} /></Link>} className="chart-panel">
          {chart.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={244}><BarChart data={chart} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8a91a1', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a91a1', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip formatter={(value) => formatMoney(value)} cursor={{ fill: '#f5f6fb' }} /><Bar dataKey="amount" fill="#6258d9" radius={[5, 5, 0, 0]} maxBarSize={34} /></BarChart></ResponsiveContainer></div> : <div className="chart-placeholder"><span className="chart-trend"><ArrowUpRight size={15} /> Salary data will appear here</span><div className="chart-placeholder-bars">{[40, 65, 48, 80, 54, 72, 60, 91, 66, 82, 74, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><span className="muted">No salary records are available in this view.</span></div>}
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
