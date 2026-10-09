import React from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataTable, EmptyState, ErrorState, Field, formatMoney, LoadingState, PageHeading, Panel, SearchBox } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../services/api'
import { can } from '../utils/permissions'

export function SalaryRevisionsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState(user?.permission_scope === 'self' ? String(user.id) : searchParams.get('user') || '')
  const [lookup, setLookup] = useState('')
  const [matches, setMatches] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ old_ctc: '', new_ctc: '', revision_date: new Date().toISOString().slice(0, 10), reason: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const notify = useToast()
  const manager = can(user, 'salary_revisions', 'manage')
  const lockedToSelf = user?.permission_scope === 'self'

  useEffect(() => {
    if (lockedToSelf) return
    if (lookup.trim().length < 2) { setMatches([]); return }
    const timeout = window.setTimeout(() => api.users({ search: lookup, per_page: 8, page: 1 }).then((result) => setMatches(result.users || [])).catch(() => setMatches([])), 250)
    return () => window.clearTimeout(timeout)
  }, [lookup, lockedToSelf])

  useEffect(() => {
    if (!selectedId) { setRows([]); return }
    setLoading(true)
    setError(null)
    api.salaryRevisions(selectedId, { page: 1, per_page: 25 }).then((result) => setRows(result.salary_revisions || [])).catch(setError).finally(() => setLoading(false))
  }, [selectedId])

  function chooseUser(person) {
    setSelectedId(String(person.id))
    setSearchParams({ user: String(person.id) })
    setLookup(`${person.first_name} ${person.last_name}`)
    setMatches([])
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.createSalaryRevision(selectedId, { ...form, old_ctc: Number(form.old_ctc), new_ctc: Number(form.new_ctc) })
      notify('Salary revision added.')
      setFormOpen(false)
      const result = await api.salaryRevisions(selectedId, { page: 1, per_page: 25 })
      setRows(result.salary_revisions || [])
      setForm({ old_ctc: '', new_ctc: '', revision_date: new Date().toISOString().slice(0, 10), reason: '' })
    } catch (requestError) { setFormError(requestError.errors?.join(', ') || requestError.message) }
    finally { setSaving(false) }
  }

  return <div className="page-stack">
    <PageHeading eyebrow="COMPENSATION" title="Salary history" description="A clear audit trail of salary changes." actions={manager && selectedId && <button className="button button--primary" onClick={() => setFormOpen((open) => !open)}><Plus size={17} /> Add revision</button>} />
    {!lockedToSelf && <Panel className="search-panel"><Field label="Find an employee"><SearchBox value={lookup} onChange={setLookup} placeholder="Search employee name, email or ID" /></Field>{matches.length > 0 && <div className="lookup-results">{matches.map((person) => <button key={person.id} onClick={() => chooseUser(person)}><span>{person.first_name} {person.last_name}</span><small>{person.employee_code} · {person.department?.name}</small></button>)}</div>}{selectedId && <p className="selected-hint">Selected employee ID: {selectedId}</p>}</Panel>}
    {formOpen && <Panel title="Create salary revision" subtitle="This records a history entry; use salary update to change current CTC." className="form-panel">
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <form className="form-grid" onSubmit={submit}>
        <Field label="Previous CTC" required><input type="number" min="0" step="0.01" value={form.old_ctc} onChange={(event) => setForm({ ...form, old_ctc: event.target.value })} required /></Field>
        <Field label="New CTC" required><input type="number" min="0" step="0.01" value={form.new_ctc} onChange={(event) => setForm({ ...form, new_ctc: event.target.value })} required /></Field>
        <Field label="Revision date" required><input type="date" value={form.revision_date} onChange={(event) => setForm({ ...form, revision_date: event.target.value })} required /></Field>
        <Field label="Reason"><input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} maxLength="255" /></Field>
        <div className="form-actions"><button type="button" className="button button--secondary" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button--primary" disabled={saving}>{saving ? 'Saving…' : 'Add revision'}</button></div>
      </form>
    </Panel>}
    <Panel title="Revision timeline" subtitle={selectedId ? `Employee #${selectedId}` : 'Select an employee to view history'}>
      {loading ? <LoadingState label="Loading revisions" /> : error ? <ErrorState error={error} onRetry={() => setSelectedId((current) => `${current}`)} /> : !selectedId ? <EmptyState title="Choose an employee" description="Search by name, email or employee ID to view salary history." /> : <DataTable rows={rows} emptyTitle="No revisions recorded" emptyDescription="Salary changes will be listed here." columns={[
        { key: 'revision_date', label: 'REVISION DATE' },
        { key: 'old_ctc', label: 'PREVIOUS CTC', render: (revision) => formatMoney(revision.old_ctc) },
        { key: 'new_ctc', label: 'NEW CTC', render: (revision) => <strong>{formatMoney(revision.new_ctc)}</strong> },
        { key: 'increment_percentage', label: 'CHANGE', render: (revision) => revision.increment_percentage === null ? '—' : <span className="change-positive"><ArrowUpRight size={15} />{revision.increment_percentage}%</span> },
        { key: 'reason', label: 'REASON', render: (revision) => revision.reason || '—' },
      ]} />}
    </Panel>
  </div>
}
