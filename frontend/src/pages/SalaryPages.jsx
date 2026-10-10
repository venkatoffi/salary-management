import React from 'react'
import { ArrowLeft, Eye, History, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DataTable, Drawer, ErrorState, Field, formatMoney, LinkButton, LoadingState, PageHeading, Pagination, Panel, SearchBox } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'
import { can } from '../utils/permissions'

export function SalariesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const query = useMemo(() => ({ page, per_page: 10, search, department_id: departmentId }), [page, search, departmentId])
  const load = useCallback(() => api.salaries(query), [query])
  const { data, loading, error, retry } = useLoad(load)
  useEffect(() => {
    if (user?.capabilities?.departments?.read) api.departments().then((result) => setDepartments(result.departments || [])).catch(() => setDepartments([]))
  }, [user])
  if (loading) return <LoadingState label="Loading salaries" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const rows = data.salaries || []
  return <div className="page-stack">
    <PageHeading eyebrow="COMPENSATION" title="Salaries" description="Current salary records within your access scope." actions={can(user, 'salaries', 'manage') && <LinkButton to="/salaries/new"><Plus size={17} /> Add salary</LinkButton>} />
    <Panel title="Current salary records" subtitle={`${data.meta?.total || rows.length} records`}>
      <div className="filter-bar"><SearchBox value={search} onChange={(value) => { setPage(1); setSearch(value) }} placeholder="Search employee name or code" />{departments.length > 0 && <select className="filter-select" aria-label="Filter by department" value={departmentId} onChange={(event) => { setPage(1); setDepartmentId(event.target.value) }}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>}</div>
      <DataTable rows={rows} emptyTitle="No salary records" emptyDescription="Salary records will appear here when they are added." onRowClick={(salary) => setSelectedId(salary.id)} columns={[
        { key: 'user', label: 'EMPLOYEE', render: (salary) => <span className="person-cell"><span className="avatar avatar--table">{salary.user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{salary.user?.name || `Employee #${salary.user_id}`}</strong><small>{salary.user?.employee_code || 'View employee profile'}</small></span></span> },
        { key: 'department', label: 'DEPARTMENT', render: (salary) => salary.user?.department?.name || '—' },
        { key: 'current_ctc', label: 'CURRENT CTC', render: (salary) => <strong>{formatMoney(salary.current_ctc)}</strong> },
        { key: 'date_of_joining', label: 'JOINED', render: (salary) => salary.user?.date_of_joining || '—' },
        { key: 'last_revision_date', label: 'LAST REVISION', render: (salary) => salary.last_revision_date || '—' },
        { key: 'view', label: '', render: (salary) => <button className="table-icon-link" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(salary.id) }} aria-label={`View salary for ${salary.user?.name || salary.user_id}`}><Eye size={17} /></button> },
      ]} />
      <Pagination meta={data.meta} onPage={setPage} />
    </Panel>
    <SalaryDetailDrawer id={selectedId} open={selectedId !== null} onClose={() => setSelectedId(null)} />
  </div>
}

export function SalaryDetailDrawer({ id, open, onClose }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const load = useCallback(() => {
    if (!id) return Promise.resolve(null)
    setLoading(true)
    setError(null)
    return api.salary(id).then(setData).catch(setError).finally(() => setLoading(false))
  }, [id])
  useEffect(() => { if (open) load() }, [open, load])
  const retry = () => load()
  const salary = data?.salary
  return <Drawer title="Salary details" open={open} onClose={onClose}>
    {loading ? <LoadingState label="Loading salary history" /> : error ? <ErrorState error={error} onRetry={retry} /> : salary && <>
      <div className="drawer-summary"><span>{salary.user?.name || `Employee #${salary.user_id}`}</span><strong>{formatMoney(salary.current_ctc)}</strong><small>{salary.user?.employee_code} · {salary.user?.department?.name}</small></div>
      <dl className="detail-list"><div><dt>Joining date</dt><dd>{salary.user?.date_of_joining || '—'}</dd></div><div><dt>Effective from</dt><dd>{salary.effective_from}</dd></div><div><dt>Last revision</dt><dd>{salary.last_revision_date || 'No revisions'}</dd></div><div><dt>Currency</dt><dd>{salary.currency_code}</dd></div></dl>
      <h3 className="drawer-subheading">Revision history</h3>
      {(data.salary_revisions || []).length ? <ol className="revision-timeline">{data.salary_revisions.map((revision) => <li key={revision.id}>
        <strong>{new Date(`${revision.revision_date}T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
        <span>{formatMoney(revision.old_ctc)} → {formatMoney(revision.new_ctc)} <b>{revision.increment_percentage}%</b></span>
        <small>{revision.revision_date} · Approved by {revision.approved_by_name || `#${revision.approved_by_id}`}</small>
        {revision.reason && <small>{revision.reason}</small>}
      </li>)}</ol> : <p className="muted drawer-empty">No salary revisions recorded.</p>}
      {can(user, 'salaries', 'manage') && <LinkButton to={`/salaries/${salary.id}/edit`} variant="secondary">Update salary</LinkButton>}
    </>}
  </Drawer>
}

export function SalaryFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const notify = useToast()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id: '', currency_code: 'INR', current_ctc: '', effective_from: new Date().toISOString().slice(0, 10), reason: '' })
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!can(user, 'salaries', 'manage')) return
    api.users({ page: 1, per_page: 100 }).then((result) => setUsers(result.users || [])).catch(() => {})
  }, [user])
  useEffect(() => {
    if (!editing) return
    api.salary(id).then(({ salary }) => setForm({ user_id: salary.user_id, currency_code: salary.currency_code, current_ctc: salary.current_ctc, effective_from: salary.effective_from, reason: '' })).catch(setLoadError).finally(() => setLoading(false))
  }, [id, editing])

  async function submit(event) {
    event.preventDefault()
    setErrors([])
    setSaving(true)
    const payload = { currency_code: form.currency_code, current_ctc: Number(form.current_ctc), effective_from: form.effective_from, ...(form.reason ? { reason: form.reason } : {}) }
    try {
      const result = editing ? await api.updateSalary(id, payload) : await api.createSalary({ ...payload, user_id: Number(form.user_id) })
      notify(editing ? 'Salary updated and revision recorded.' : 'Salary created.')
      navigate(`/salaries/${result.salary.id}`)
    } catch (error) {
      setErrors(error.errors?.length ? error.errors : [error.message])
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingState label="Loading salary" />
  if (loadError) return <ErrorState error={loadError} />
  return <div className="page-stack">
    <Link to={editing ? `/salaries/${id}` : '/salaries'} className="back-link"><ArrowLeft size={16} /> Back to salaries</Link>
    <PageHeading eyebrow="COMPENSATION" title={editing ? 'Update salary' : 'Add salary'} description={editing ? 'Record a salary update. A revision is added automatically.' : 'Create the current salary record for an employee.'} />
    <Panel className="form-panel">
      {errors.length > 0 && <div className="form-alert" role="alert"><strong>Please review this information:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <form className="form-grid" onSubmit={submit}>
        {!editing && <Field label="Employee" required><select value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} required><option value="">Choose an employee</option>{users.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name} · {person.employee_code}</option>)}</select></Field>}
        <Field label="Annual CTC" required><input type="number" min="0" step="0.01" value={form.current_ctc} onChange={(event) => setForm({ ...form, current_ctc: event.target.value })} required placeholder="e.g. 85000" /></Field>
        <Field label="Currency" required><select value={form.currency_code} onChange={(event) => setForm({ ...form, currency_code: event.target.value })}><option value="INR">INR — Indian rupee</option></select></Field>
        <Field label="Effective from" required><input type="date" value={form.effective_from} onChange={(event) => setForm({ ...form, effective_from: event.target.value })} required /></Field>
        {editing && <Field label="Revision reason"><textarea rows="3" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Optional context for this salary change" maxLength="255" /> </Field>}
        <div className="form-actions"><LinkButton to={editing ? `/salaries/${id}` : '/salaries'} variant="secondary">Cancel</LinkButton><button className="button button--primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save salary update' : 'Create salary'}</button></div>
      </form>
    </Panel>
  </div>
}

export function SalaryDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const load = useCallback(() => api.salary(id), [id])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading salary" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const salary = data.salary
  return <div className="page-stack">
    <Link to="/salaries" className="back-link"><ArrowLeft size={16} /> Back to salaries</Link>
    <PageHeading eyebrow="SALARY DETAILS" title={salary.user?.name || `Employee #${salary.user_id}`} description={`${salary.user?.employee_code || ''} · ${salary.user?.department?.name || 'Current compensation record'}`} actions={can(user, 'salaries', 'manage') && <LinkButton to={`/salaries/${id}/edit`} variant="secondary">Edit salary</LinkButton>} />
    <div className="detail-grid">
      <Panel title="Current compensation"><div className="salary-highlight">{formatMoney(salary.current_ctc)}<small>Annual CTC · INR</small></div><dl className="detail-list"><div><dt>Effective from</dt><dd>{salary.effective_from}</dd></div><div><dt>Employee</dt><dd><Link to={`/employees/${salary.user_id}`} className="text-link">{salary.user?.name || `Employee #${salary.user_id}`}</Link></dd></div></dl></Panel>
      <Panel title="History" subtitle="Salary changes for this employee">{(data.salary_revisions || []).length ? <ol className="revision-timeline">{data.salary_revisions.map((revision) => <li key={revision.id}><strong>{revision.revision_date}</strong><span>{formatMoney(revision.old_ctc)} → {formatMoney(revision.new_ctc)} ({revision.increment_percentage}%)</span><small>{revision.approved_by_name || `Approver #${revision.approved_by_id}`} · {revision.reason || '—'}</small></li>)}</ol> : <p className="panel-copy">No revisions are recorded.</p>}<LinkButton to={`/salary-revisions?user=${salary.user_id}`} variant="secondary"><History size={16} /> View salary history</LinkButton></Panel>
    </div>
  </div>
}
