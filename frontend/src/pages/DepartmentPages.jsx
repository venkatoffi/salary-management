import React from 'react'
import { ArrowLeft, ArrowRight, BadgeDollarSign, Building2, Code2, HeartHandshake, Laptop, Megaphone, PackageCheck, UsersRound } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, EmptyState, ErrorState, LoadingState, PageHeading, Pagination, Panel, StatCard } from '../components/ui'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'

const departmentIcons = [Code2, HeartHandshake, BadgeDollarSign, Megaphone, Laptop, PackageCheck]

export function DepartmentsPage() {
  const load = useCallback(() => api.departments(), [])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading departments" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const departments = data.departments || []
  return <div className="page-stack">
    <PageHeading eyebrow="ORGANISATION" title="Departments" description="Explore teams and their employee rosters." />
    {departments.length ? <div className="department-grid">{departments.map((department, index) => {
      const Icon = departmentIcons[index % departmentIcons.length]
      return <Link to={`/departments/${department.id}`} className="department-card" key={department.id}>
        <div className={`department-symbol department-symbol--${index % 6}`}><Icon size={20} /></div><span className="department-arrow"><ArrowRight size={17} /></span>
        <h2>{department.name}</h2><p>{department.description || 'Department overview and team members'}</p>
        <span className="department-card-meta"><span>{department.department_head?.name || 'Head unassigned'}</span><strong>{department.employee_count ?? 0} employees</strong></span>
      </Link>
    })}</div> : <Panel><EmptyState title="No departments yet" description="Departments will appear when they are available to your role." /></Panel>}
  </div>
}

export function DepartmentDetailsPage() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  const load = useCallback(() => Promise.all([api.department(id), api.users({ department_id: id, page, per_page: 10 })]).then(([department, users]) => ({ department: department.department, users })), [id, page])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading department" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const { department, users } = data
  return <div className="page-stack">
    <Link to="/departments" className="back-link"><ArrowLeft size={16} /> Back to departments</Link>
    <PageHeading eyebrow="DEPARTMENT" title={department.name} description={department.description || 'A closer look at this team.'} />
    <div className="stat-grid stat-grid--compact"><StatCard label="Team members" value={department.employee_count ?? users.meta?.total ?? 0} caption="In this department" icon={UsersRound} tone="blue" /><StatCard label="Department head" value={department.department_head?.name || 'Unassigned'} caption="Department owner" icon={Building2} tone="purple" /></div>
    <Panel title="Team members" subtitle="Employees in this department"><DataTable rows={users.users || []} columns={[
      { key: 'name', label: 'EMPLOYEE', render: (person) => <Link to={`/employees/${person.id}`} className="person-cell"><span className="avatar avatar--table">{person.first_name?.[0]}{person.last_name?.[0]}</span><span><strong>{person.first_name} {person.last_name}</strong><small>{person.email}</small></span></Link> },
      { key: 'employee_code', label: 'EMPLOYEE ID' },
      { key: 'job_title', label: 'JOB TITLE', render: (person) => person.job_title || '—' },
      { key: 'employment_status', label: 'STATUS' },
    ]} /><Pagination meta={users.meta} onPage={setPage} /></Panel>
  </div>
}
