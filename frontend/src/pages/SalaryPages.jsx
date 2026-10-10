import React from 'react'
import { ArrowLeft, ArrowRight, History, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DataTable, ErrorState, Field, formatMoney, LinkButton, LoadingState, PageHeading, Pagination, Panel } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'
import { can } from '../utils/permissions'

export function SalariesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const load = useCallback(() => api.salaries({ page, per_page: 10 }), [page])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading salaries" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const rows = data.salaries || []
  return <div className="page-stack">
    <PageHeading eyebrow="COMPENSATION" title="Salaries" description="Current salary records within your access scope." actions={can(user, 'salaries', 'manage') && <LinkButton to="/salaries/new"><Plus size={17} /> Add salary</LinkButton>} />
    <Panel title="Current salary records" subtitle={`${data.meta?.total || rows.length} records`}>
      <DataTable rows={rows} emptyTitle="No salary records" emptyDescription="Salary records will appear here when they are added." columns={[
        { key: 'user_id', label: 'EMPLOYEE', render: (salary) => <Link className="person-cell" to={`/employees/${salary.user_id}`}><span className="avatar avatar--table">#{salary.user_id}</span><span><strong>Employee #{salary.user_id}</strong><small>View employee profile</small></span></Link> },
        { key: 'current_ctc', label: 'CURRENT CTC', render: (salary) => <strong>{formatMoney(salary.current_ctc, salary.currency_code)}</strong> },
        { key: 'currency_code', label: 'CURRENCY' },
        { key: 'effective_from', label: 'EFFECTIVE FROM' },
        { key: 'view', label: '', render: (salary) => <Link className="text-link" to={`/salaries/${salary.id}`}>Details <ArrowRight size={15} /></Link> },
      ]} />
      <Pagination meta={data.meta} onPage={setPage} />
    </Panel>
  </div>
}

export function SalaryFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const notify = useToast()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id: '', currency_code: 'USD', current_ctc: '', effective_from: new Date().toISOString().slice(0, 10), reason: '' })
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
        <Field label="Currency" required><select value={form.currency_code} onChange={(event) => setForm({ ...form, currency_code: event.target.value })}>{['USD', 'INR', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD'].map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
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
    <PageHeading eyebrow="SALARY DETAILS" title={`Employee #${salary.user_id}`} description="Current compensation record." actions={can(user, 'salaries', 'manage') && <LinkButton to={`/salaries/${id}/edit`} variant="secondary">Edit salary</LinkButton>} />
    <div className="detail-grid">
      <Panel title="Current compensation"><div className="salary-highlight">{formatMoney(salary.current_ctc, salary.currency_code)}<small>Annual CTC · {salary.currency_code}</small></div><dl className="detail-list"><div><dt>Effective from</dt><dd>{salary.effective_from}</dd></div><div><dt>Employee</dt><dd><Link to={`/employees/${salary.user_id}`} className="text-link">Employee #{salary.user_id}</Link></dd></div></dl></Panel>
      <Panel title="History" subtitle="Salary changes for this employee"><p className="panel-copy">Each salary update creates a dated revision for audit history.</p><LinkButton to={`/salary-revisions?user=${salary.user_id}`} variant="secondary"><History size={16} /> View salary history</LinkButton></Panel>
    </div>
  </div>
}
