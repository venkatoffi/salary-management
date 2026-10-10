import React from 'react'
import { History, Pencil, ReceiptText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Drawer, ErrorState, Field, formatMoney, initials, LinkButton, LoadingState, PageHeading, Panel } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'

const editableFields = ['first_name', 'last_name', 'email', 'sex', 'country_code', 'city', 'state']

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const notify = useToast()
  const load = useCallback(() => api.currentUser(), [])
  const { data, loading, error, retry } = useLoad(load)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState([])
  const [savedProfile, setSavedProfile] = useState(null)
  const profile = savedProfile || data?.user

  useEffect(() => {
    if (profile) setForm(Object.fromEntries(editableFields.map((key) => [key, profile[key] || ''])))
  }, [profile])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormErrors([])
    try {
      const result = await api.updateCurrentUser(form)
      updateUser(result.user)
      setSavedProfile(result.user)
      notify('Profile updated successfully.')
      setEditing(false)
    } catch (requestError) {
      setFormErrors(requestError.errors?.length ? requestError.errors : [requestError.message])
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingState label="Loading your profile" />
  if (error) return <ErrorState error={error} onRetry={retry} />

  const sections = [
    ['Personal Information', [
      ['First Name', profile.first_name],
      ['Last Name', profile.last_name],
      ['Email', profile.email],
      ['Sex', profile.sex],
    ]],
    ['Employment Information', [
      ['Role', profile.role_name], ['Job title', profile.job_title], ['Employee ID', profile.employee_code],
      ['Date joined', profile.date_of_joining], ['Last working date', profile.last_working_date],
    ]],
    ['Location', [['Country', profile.country_code], ['City', profile.city], ['State', profile.state]]],
    ['Department & Reporting Manager', [['Department', profile.department?.name], ['Reporting manager', profile.department_head?.name]]],
  ]
  return <div className="page-stack">
    <PageHeading eyebrow="YOUR ACCOUNT" title="My profile" description="Your personal and work information." actions={<button className="button button--secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit personal details</button>} />
    <section className="profile-banner" aria-label="Profile summary">
      <span className="avatar avatar--profile">{initials(profile.name || `${profile.first_name} ${profile.last_name}`)}</span>
      <span className="profile-banner-copy"><h2>{profile.name || `${profile.first_name} ${profile.last_name}`}</h2><p>{profile.role_name} · {profile.email}</p><small>{profile.job_title || 'Team member'}</small></span>
      <span className={`status-pill status-pill--${profile.employment_status === 'active' ? 'green' : 'gray'}`}><i />{profile.employment_status === 'active' ? 'Active' : 'Inactive'}</span>
    </section>
    <div className="profile-information-grid">
      {sections.map(([title, fields]) => <section className="profile-information-card" aria-label={title} key={title}>
        <h2>{title}</h2>
        <dl className="profile-detail-list">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
      </section>)}
      <Panel title="Current salary"><div className="salary-highlight">{profile.salary ? formatMoney(profile.salary.current_ctc) : 'Not available'}<small>{profile.salary ? `Annual CTC · ${profile.salary.effective_from}` : 'No current salary record'}</small></div><div className="panel-action-row"><LinkButton to={`/salary-revisions?user=${user.id}`} variant="secondary"><History size={16} /> Salary history</LinkButton><LinkButton to="/payslips" variant="secondary"><ReceiptText size={16} /> Payslips</LinkButton></div></Panel>
    </div>
    <Drawer title="Edit personal details" open={editing} onClose={() => setEditing(false)}>
      <form className="form-grid drawer-form" onSubmit={submit}>
        {formErrors.length > 0 && <div className="form-alert drawer-alert" role="alert"><strong>Profile could not be saved:</strong><ul>{formErrors.map((message) => <li key={message}>{message}</li>)}</ul></div>}
        <Field label="First name" required><input value={form.first_name || ''} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required autoComplete="given-name" /></Field>
        <Field label="Last name" required><input value={form.last_name || ''} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required autoComplete="family-name" /></Field>
        <Field label="Email" required><input type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" /></Field>
        <Field label="Sex"><input value={form.sex || ''} onChange={(event) => setForm({ ...form, sex: event.target.value })} /></Field>
        <Field label="Country code" required><select value={form.country_code || ''} onChange={(event) => setForm({ ...form, country_code: event.target.value })} required>{[['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['AU', 'Australia'], ['SG', 'Singapore']].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></Field>
        <Field label="City"><input value={form.city || ''} onChange={(event) => setForm({ ...form, city: event.target.value })} autoComplete="address-level2" /></Field>
        <Field label="State"><input value={form.state || ''} onChange={(event) => setForm({ ...form, state: event.target.value })} autoComplete="address-level1" /></Field>
        <div className="form-actions"><button type="button" className="button button--secondary" onClick={() => setEditing(false)}>Cancel</button><button className="button button--primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </Drawer>
  </div>
}
