import React from 'react'
import { ArrowLeft, ReceiptText } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, ErrorState, formatMoney, LoadingState, PageHeading, Pagination, Panel } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'

export function PayslipsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ month: '', year: '' })
  const [page, setPage] = useState(1)
  const load = useCallback(() => api.payslips({ ...filters, page, per_page: 10 }), [filters, page])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading payslips" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const rows = data.payslips || []
  return <div className="page-stack">
    <PageHeading eyebrow="PAY DOCUMENTS" title="Payslips" description="Monthly pay statements available within your access scope." />
    <Panel title="Payslip statements" subtitle={`${data.meta?.total || rows.length} statements`}><div className="filter-bar"><select className="filter-select" value={filters.month} onChange={(event) => { setPage(1); setFilters({ ...filters, month: event.target.value }) }} aria-label="Filter by month"><option value="">All months</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleDateString(undefined, { month: 'long' })}</option>)}</select><select className="filter-select" value={filters.year} onChange={(event) => { setPage(1); setFilters({ ...filters, year: event.target.value }) }} aria-label="Filter by year"><option value="">All years</option>{[2026, 2025, 2024, 2023].map((year) => <option key={year}>{year}</option>)}</select></div>
      <DataTable rows={rows} emptyTitle="No payslips found" description="Payslips will appear when available." columns={[
        { key: 'period', label: 'PAY PERIOD', render: (slip) => <Link className="person-cell" to={`/payslips/${slip.id}`}><span className="payslip-icon"><ReceiptText size={17} /></span><span><strong>{new Date(Number(slip.year), Number(slip.month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><small>Statement #{slip.id}</small></span></Link> },
        ...(!user?.permission_scope || user.permission_scope !== 'self' ? [{ key: 'user_id', label: 'EMPLOYEE', render: (slip) => <Link className="text-link" to={`/employees/${slip.user_id}`}>Employee #{slip.user_id}</Link> }] : []),
        { key: 'total_earnings', label: 'EARNINGS', render: (slip) => formatMoney(slip.total_earnings) },
        { key: 'total_deduction', label: 'DEDUCTIONS', render: (slip) => formatMoney(slip.total_deduction) },
        { key: 'net_pay', label: 'NET PAY', render: (slip) => <strong>{formatMoney(slip.net_pay)}</strong> },
      ]} />
      <Pagination meta={data.meta} onPage={setPage} />
    </Panel>
  </div>
}

export function PayslipDetailsPage() {
  const { id } = useParams()
  const load = useCallback(() => api.payslip(id), [id])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading payslip" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const slip = data.payslip
  const period = new Date(Number(slip.year), Number(slip.month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  return <div className="page-stack"><Link to="/payslips" className="back-link"><ArrowLeft size={16} /> Back to payslips</Link><PageHeading eyebrow="PAY STATEMENT" title={period} description={`Statement #${slip.id} · Employee #${slip.user_id}`} /><div className="payslip-detail"><div className="payslip-detail-head"><div className="payslip-icon payslip-icon--large"><ReceiptText size={22} /></div><span><strong>Monthly payslip</strong><small>{period}</small></span><span className="payslip-period">{slip.month}/{slip.year}</span></div><div className="payslip-detail-rows"><div><span>Total earnings</span><strong>{formatMoney(slip.total_earnings)}</strong></div><div><span>Total deductions</span><strong className="deduction-value">−{formatMoney(slip.total_deduction)}</strong></div><div className="net-pay-row"><span>Net pay</span><strong>{formatMoney(slip.net_pay)}</strong></div></div><p className="payslip-disclaimer">This statement is provided for your records. Contact People Operations with any questions.</p></div></div>
}
