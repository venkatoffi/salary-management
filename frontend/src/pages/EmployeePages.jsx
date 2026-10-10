import React from 'react'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Eye, Filter, History, Plus, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, EmptyState, ErrorState, formatMoney, LinkButton, LoadingState, PageHeading, Pagination, Panel, SearchBox, StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'
import { roleIs } from '../utils/permissions'

export function EmployeesPage() {
  const [filters, setFilters] = useState({ search: '', department_id: '', country_code: '', employment_status: '' })
  const [page, setPage] = useState(1)
  const [departments, setDepartments] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const notify = useToast()
  const { user } = useAuth()
  const privileged = roleIs(user, 'Chiefs', 'HR Manager')
  const query = useMemo(() => ({ ...filters, page, per_page: 10 }), [filters, page])

  useEffect(() => { api.departments().then((response) => setDepartments(response.departments || [])).catch(() => {}) }, [])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true)
      api.users(query).then(setData).catch(setError).finally(() => setLoading(false))
    }, filters.search ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [query, filters.search])

  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })) }
  const employees = data?.users || []
  const rows = employees.map((person) => ({ ...person, full_name: `${person.first_name} ${person.last_name}` }))
  const columns = [
    { key: 'full_name', label: 'EMPLOYEE', render: (person) => <Link to={`/employees/${person.id}`} className="person-cell"><span className="avatar avatar--table">{person.first_name?.[0]}{person.last_name?.[0]}</span><span><strong>{person.full_name}</strong><small>{person.email}</small></span></Link> },
    { key: 'employee_code', label: 'EMPLOYEE ID' },
    { key: 'department', label: 'DEPARTMENT', render: (person) => person.department?.name || '—' },
    { key: 'job_title', label: 'JOB TITLE', render: (person) => person.job_title || '—' },
    { key: 'employment_status', label: 'STATUS', render: (person) => <span className={`status-pill status-pill--${person.employment_status === 'active' ? 'green' : 'gray'}`}><i />{person.employment_status}</span> },
    { key: 'actions', label: '', render: (person) => <Link className="table-icon-link" to={`/employees/${person.id}`} aria-label={`View ${person.first_name}`}><Eye size={17} /></Link> },
  ]

  async function createEmployee() {
    const email = window.prompt('Work email address for the new employee')
    if (!email) return
    const roleId = window.prompt('Employee role ID')
    if (!roleId) return
    const deptId = window.prompt('Department ID')
    if (!deptId) return
    const password = window.prompt('Temporary password')
    if (!password) return
    try {
      await api.createUser({ first_name: email.split('@')[0], last_name: 'New employee', email, employee_code: `NEW-${Date.now()}`, employment_status: 'active', country_code: 'US', date_of_joining: new Date().toISOString().slice(0, 10), role_id: Number(roleId), department_id: Number(deptId), password })
      notify('Employee created.')
      setPage(1)
      api.users({ ...query, page: 1 }).then(setData)
    } catch (createError) { notify(createError.message, 'error') }
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PEOPLE DIRECTORY" title="Employees" description="Find and manage people across your organisation." actions={privileged && <button className="button button--primary" onClick={createEmployee}><Plus size={17} /> Add employee</button>} />
      <div className="stat-grid stat-grid--compact">
        <StatCard label="Employees shown" value={data?.meta?.total?.toLocaleString() ?? '—'} caption="Matching your filters" icon={UserRound} tone="blue" />
        <StatCard label="Current page" value={page} caption="10 employees per page" icon={BriefcaseBusiness} tone="purple" />
        <StatCard label="Active filters" value={Object.values(filters).filter(Boolean).length} caption="Refine this directory" icon={Filter} tone="amber" />
      </div>
      <Panel className="table-panel">
        <div className="filter-bar">
          <SearchBox value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="Search name, email or employee ID" />
          <select className="filter-select" value={filters.department_id} onChange={(event) => updateFilter('department_id', event.target.value)} aria-label="Filter by department"><option value="">All departments</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select>
          <select className="filter-select" value={filters.country_code} onChange={(event) => updateFilter('country_code', event.target.value)} aria-label="Filter by country"><option value="">All countries</option>{['IN', 'US', 'GB', 'CA', 'AU', 'SG'].map((country) => <option key={country}>{country}</option>)}</select>
          <select className="filter-select" value={filters.employment_status} onChange={(event) => updateFilter('employment_status', event.target.value)} aria-label="Filter by employment status"><option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {loading && !data ? <LoadingState label="Loading employees" /> : error && !data ? <ErrorState error={error} onRetry={() => api.users(query).then(setData).catch(setError)} /> : <>
          {error && <div className="inline-warning">{error.message}</div>}
          <DataTable rows={rows} columns={columns} emptyTitle="No employees found" emptyDescription="Adjust the search or filters to see more people." />
          <Pagination meta={data?.meta} onPage={setPage} />
        </>}
      </Panel>
    </div>
  )
}

export function EmployeeDetailsPage() {
  const { id } = useParams()
  const load = useCallback(() => Promise.all([api.user(id), api.salaries({ user_id: id, per_page: 1 })])
    .then(([profile, salaryData]) => ({ person: profile.user, salary: salaryData.salaries?.[0] })), [id])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading employee profile" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const { person, salary } = data
  return <div className="page-stack">
    <Link to="/employees" className="back-link"><ArrowLeft size={16} /> Back to employees</Link>
    <PageHeading eyebrow="EMPLOYEE PROFILE" title={`${person.first_name} ${person.last_name}`} description={`${person.job_title || 'Team member'} · ${person.department?.name || 'No department'}`} actions={<span className={`status-pill status-pill--${person.employment_status === 'active' ? 'green' : 'gray'}`}><i />{person.employment_status}</span>} />
    <div className="detail-grid">
      <Panel title="Personal information" subtitle="Employee and contact details"><dl className="detail-list">{[['Email', person.email], ['Employee ID', person.employee_code], ['Department', person.department?.name], ['Country', person.country_code], ['City', person.city || '—'], ['Start date', person.date_of_joining]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></Panel>
      <Panel title="Current salary" subtitle="Latest salary record">
        {salary ? <><div className="salary-highlight">{formatMoney(salary.current_ctc, salary.currency_code)}<small>Annual CTC · {salary.currency_code}</small></div><dl className="detail-list detail-list--compact"><div><dt>Effective from</dt><dd>{salary.effective_from}</dd></div></dl></> : <EmptyState title="No salary record" description="There is no current salary attached to this profile." />}
        <div className="panel-action-row"><LinkButton to={`/salary-revisions?user=${person.id}`} variant="secondary"><History size={16} /> Salary history</LinkButton>{salary && <LinkButton to={`/salaries/${salary.id}`} variant="secondary">Salary details <ArrowRight size={15} /></LinkButton>}</div>
      </Panel>
    </div>
  </div>
}
