import React from 'react'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Eye, Filter, History, Plus, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, Drawer, EmptyState, ErrorState, Field, formatMoney, LinkButton, LoadingState, PageHeading, Pagination, Panel, SearchBox, StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'
import { roleIs } from '../utils/permissions'

export function EmployeesPage() {
  const [filters, setFilters] = useState({ search: '', department_id: '', country_code: '', employment_status: '' })
  const [page, setPage] = useState(1)
  const [departments, setDepartments] = useState([])
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const notify = useToast()
  const { user } = useAuth()
  const privileged = roleIs(user, 'Chiefs', 'HR Manager')
  const query = useMemo(() => ({ ...filters, page, per_page: 10 }), [filters, page])

  useEffect(() => {
    if (!user?.capabilities?.departments?.read) return
    api.departments().then((response) => setDepartments(response.departments || [])).catch(setError)
  }, [user])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      api.users(query).then(setData).catch(setError).finally(() => setLoading(false))
    }, filters.search ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [query, filters.search, refresh])

  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })) }
  async function previewEmployee(person) {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const result = await api.user(person.id)
      setSelectedPerson(result.user)
    } catch (requestError) {
      setPreviewError(requestError)
      setSelectedPerson({ id: person.id })
    } finally { setPreviewLoading(false) }
  }
  async function employeeCreated() {
    setAdding(false)
    setPage(1)
    setRefresh((current) => current + 1)
  }
  const employees = data?.users || []
  const rows = employees.map((person) => ({ ...person, full_name: `${person.first_name} ${person.last_name}` }))
  const columns = [
    { key: 'full_name', label: 'EMPLOYEE', render: (person) => <Link to={`/employees/${person.id}`} className="person-cell"><span className="avatar avatar--table">{person.first_name?.[0]}{person.last_name?.[0]}</span><span><strong>{person.full_name}</strong><small>{person.email}</small></span></Link> },
    { key: 'employee_code', label: 'EMPLOYEE ID' },
    { key: 'department', label: 'DEPARTMENT', render: (person) => person.department?.name || '—' },
    { key: 'job_title', label: 'JOB TITLE', render: (person) => person.job_title || '—' },
    { key: 'employment_status', label: 'STATUS', render: (person) => <span className={`status-pill status-pill--${person.employment_status === 'active' ? 'green' : 'gray'}`}><i />{person.employment_status}</span> },
    { key: 'actions', label: '', render: (person) => <button className="table-icon-link" type="button" title={`View ${person.first_name} ${person.last_name}`} onClick={() => previewEmployee(person)} aria-label={`View ${person.first_name} ${person.last_name}`}><Eye size={17} /></button> },
  ]

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PEOPLE DIRECTORY" title="Employees" description="Find and manage people across your organisation." actions={privileged && <button className="button button--primary" onClick={() => setAdding(true)}><Plus size={17} /> Add employee</button>} />
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
      <Drawer title="Employee details" open={Boolean(selectedPerson) || previewLoading} onClose={() => { setSelectedPerson(null); setPreviewError(null) }}>
        {previewLoading ? <LoadingState label="Loading employee details" /> : previewError ? <ErrorState error={previewError} onRetry={() => selectedPerson && previewEmployee(selectedPerson)} /> : selectedPerson && <EmployeePreview person={selectedPerson} />}
      </Drawer>
      <EmployeeCreateDrawer open={adding} onClose={() => setAdding(false)} onCreated={employeeCreated} notify={notify} />
    </div>
  )
}

function EmployeePreview({ person }) {
  const sections = [
    ['Personal Information', [['First name', person.first_name], ['Last name', person.last_name], ['Email', person.email], ['Sex', person.sex]]],
    ['Employment', [
      ['Role', person.role?.name], ['Job title', person.job_title], ['Employee code', person.employee_code],
      ['Employment status', <span key="status" className={`status-pill status-pill--${person.employment_status === 'active' ? 'green' : 'gray'}`}><i />{person.employment_status === 'active' ? 'Active' : 'Inactive'}</span>],
      ['Joining date', person.date_of_joining], ['Last working date', person.last_working_date],
    ]],
    ['Location', [['City', person.city], ['State', person.state], ['Country code', person.country_code]]],
    ['Department & Reporting', [['Department', person.department?.name], ['Department head', person.department_head?.name]]],
  ]
  return <div className="drawer-section">
    {sections.map(([title, fields]) => <section className="employee-detail-section" aria-label={title} key={title}>
      <h3>{title}</h3>
      <dl className="employee-detail-grid">{fields.map(([label, value]) => <div className="employee-detail-row" key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
    </section>)}
    {person.salary && <div className="drawer-summary"><span>Current annual CTC</span><strong>{formatMoney(person.salary.current_ctc)}</strong><small>Effective {person.salary.effective_from} · {person.salary.currency_code}</small></div>}
    <LinkButton to={`/employees/${person.id}`} variant="secondary">Open full profile <ArrowRight size={15} /></LinkButton>
  </div>
}

export function EmployeeCreateDrawer({ open, onClose, onCreated, notify }) {
  const [departments, setDepartments] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState([])
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', sex: '', role_id: '', job_title: '',
    employee_code: '', employment_status: 'active', country_code: 'IN', city: '', state: '',
    date_of_joining: '', last_working_date: '', department_id: '', password: '', password_confirmation: '',
  })
  const loadOptions = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    return Promise.all([api.departments(), api.roles()])
      .then(([departmentResult, roleResult]) => {
        setDepartments(departmentResult.departments || [])
        setRoles(roleResult.roles || [])
      })
      .catch(setLoadError)
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { if (open) loadOptions() }, [open, loadOptions])

  function change(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors([])
    try {
      await api.createUser({ ...form, role_id: Number(form.role_id), department_id: Number(form.department_id) })
      notify('Employee created successfully.')
      setForm({
        first_name: '', last_name: '', email: '', sex: '', role_id: '', job_title: '', employee_code: '',
        employment_status: 'active', country_code: 'IN', city: '', state: '', date_of_joining: '',
        last_working_date: '', department_id: '', password: '', password_confirmation: '',
      })
      onCreated()
    } catch (error) {
      setErrors(error.errors?.length ? error.errors : [error.message])
    } finally { setSaving(false) }
  }

  return <Drawer title="Add employee" open={open} onClose={onClose}>
    {loading ? <LoadingState label="Loading departments and roles" /> : loadError ? <ErrorState error={loadError} onRetry={loadOptions} /> : <form className="form-grid drawer-form" onSubmit={submit}>
      {errors.length > 0 && <div className="form-alert drawer-alert" role="alert"><strong>Please review this information:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <Field label="First name" required><input value={form.first_name} onChange={(event) => change('first_name', event.target.value)} required autoComplete="given-name" /></Field>
      <Field label="Last name" required><input value={form.last_name} onChange={(event) => change('last_name', event.target.value)} required autoComplete="family-name" /></Field>
      <Field label="Email" required><input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required autoComplete="email" /></Field>
      <Field label="Sex"><input value={form.sex} onChange={(event) => change('sex', event.target.value)} /></Field>
      <Field label="Role" required><select value={form.role_id} onChange={(event) => change('role_id', event.target.value)} required><option value="">Choose a role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></Field>
      <Field label="Job title"><input value={form.job_title} onChange={(event) => change('job_title', event.target.value)} /></Field>
      <Field label="Employee code" required><input value={form.employee_code} onChange={(event) => change('employee_code', event.target.value)} required /></Field>
      <Field label="Employment status" required><select value={form.employment_status} onChange={(event) => change('employment_status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
      <Field label="Department" required><select value={form.department_id} onChange={(event) => change('department_id', event.target.value)} required><option value="">Choose a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
      <Field label="Department head / reporting manager"><input value={departments.find((department) => String(department.id) === form.department_id)?.department_head?.name || 'Not assigned'} readOnly /></Field>
      <Field label="Country" required><select value={form.country_code} onChange={(event) => change('country_code', event.target.value)} required>{[['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['AU', 'Australia'], ['SG', 'Singapore']].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></Field>
      <Field label="City"><input value={form.city} onChange={(event) => change('city', event.target.value)} /></Field>
      <Field label="State"><input value={form.state} onChange={(event) => change('state', event.target.value)} /></Field>
      <Field label="Joining date" required><input type="date" value={form.date_of_joining} onChange={(event) => change('date_of_joining', event.target.value)} required /></Field>
      <Field label="Last working date"><input type="date" value={form.last_working_date} onChange={(event) => change('last_working_date', event.target.value)} /></Field>
      <Field label="Temporary password" required><input type="password" value={form.password} onChange={(event) => change('password', event.target.value)} required autoComplete="new-password" /></Field>
      <Field label="Confirm password" required><input type="password" value={form.password_confirmation} onChange={(event) => change('password_confirmation', event.target.value)} required autoComplete="new-password" /></Field>
      <div className="form-actions"><button type="button" className="button button--secondary" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={saving}>{saving ? 'Creating…' : 'Create employee'}</button></div>
    </form>}
  </Drawer>
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
      <Panel title="Personal information" subtitle="Employee and contact details"><dl className="detail-list">{[['Email', person.email], ['Sex', person.sex], ['Role', person.role?.name], ['Employee ID', person.employee_code], ['Job title', person.job_title], ['Department', person.department?.name], ['Department head', person.department_head?.name], ['Country code', person.country_code], ['City', person.city], ['State', person.state], ['Employment status', person.employment_status], ['Start date', person.date_of_joining], ['Last working date', person.last_working_date]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></Panel>
      <Panel title="Current salary" subtitle="Latest salary record">
        {salary ? <><div className="salary-highlight">{formatMoney(salary.current_ctc)}<small>Annual CTC · INR</small></div><dl className="detail-list detail-list--compact"><div><dt>Effective from</dt><dd>{salary.effective_from}</dd></div></dl></> : <EmptyState title="No salary record" description="There is no current salary attached to this profile." />}
        <div className="panel-action-row"><LinkButton to={`/salary-revisions?user=${person.id}`} variant="secondary"><History size={16} /> Salary history</LinkButton>{salary && <LinkButton to={`/salaries/${salary.id}`} variant="secondary">Salary details <ArrowRight size={15} /></LinkButton>}</div>
      </Panel>
    </div>
  </div>
}
