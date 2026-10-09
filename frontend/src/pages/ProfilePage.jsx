import React from 'react'
import { History, ReceiptText } from 'lucide-react'
import { useCallback } from 'react'
import { ErrorState, formatMoney, LinkButton, LoadingState, PageHeading, Panel } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'

export function ProfilePage() {
  const { user } = useAuth()
  const load = useCallback(() => Promise.all([api.user(user.id), api.salaries({ user_id: user.id, per_page: 1 })]).then(([profile, salaries]) => ({ profile: profile.user, salary: salaries.salaries?.[0] })), [user.id])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading your profile" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const profile = data.profile
  return <div className="page-stack"><PageHeading eyebrow="YOUR ACCOUNT" title="My profile" description="Your personal and work information." /><div className="profile-banner"><span className="avatar avatar--profile">{profile.first_name?.[0]}{profile.last_name?.[0]}</span><span><h2>{profile.first_name} {profile.last_name}</h2><p>{profile.job_title || user.role_name} · {profile.department?.name}</p></span><span className="status-pill status-pill--green"><i />{profile.employment_status}</span></div><div className="detail-grid"><Panel title="Work information"><dl className="detail-list">{[['Work email', profile.email], ['Employee ID', profile.employee_code], ['Department', profile.department?.name], ['Role', user.role_name], ['Country', profile.country_code], ['Date joined', profile.date_of_joining]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></Panel><Panel title="Current salary"><div className="salary-highlight">{data.salary ? formatMoney(data.salary.current_ctc, data.salary.currency_code) : 'Not available'}<small>{data.salary ? `Annual CTC · Effective ${data.salary.effective_from}` : 'No current salary record'}</small></div><div className="panel-action-row"><LinkButton to={`/salary-revisions?user=${user.id}`} variant="secondary"><History size={16} /> Salary history</LinkButton><LinkButton to="/payslips" variant="secondary"><ReceiptText size={16} /> Payslips</LinkButton></div></Panel></div></div>
}
