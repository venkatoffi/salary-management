import React from 'react'
import { ArrowLeft, Eye, ReceiptText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, Drawer, ErrorState, formatMoney, LoadingState, PageHeading, Pagination, Panel } from '../components/ui'
import { useLoad } from '../hooks/useLoad'
import { api } from '../services/api'

export function PayslipsPage() {
  const [filters, setFilters] = useState({ month: '', year: '' })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const load = useCallback(() => api.payslips({ ...filters, page, per_page: 10 }), [filters, page])
  const { data, loading, error, retry } = useLoad(load)
  if (loading) return <LoadingState label="Loading payslips" />
  if (error) return <ErrorState error={error} onRetry={retry} />
  const rows = data.payslips || []
  return <div className="page-stack">
    <PageHeading eyebrow="PAY DOCUMENTS" title="Payslips" description="Monthly pay statements available within your access scope." />
    <Panel title="Payslip statements" subtitle={`${data.meta?.total || rows.length} statements`}><div className="filter-bar"><select className="filter-select" value={filters.month} onChange={(event) => { setPage(1); setFilters({ ...filters, month: event.target.value }) }} aria-label="Filter by month"><option value="">All months</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleDateString(undefined, { month: 'long' })}</option>)}</select><select className="filter-select" value={filters.year} onChange={(event) => { setPage(1); setFilters({ ...filters, year: event.target.value }) }} aria-label="Filter by year"><option value="">All years</option>{[2026, 2025, 2024, 2023].map((year) => <option key={year}>{year}</option>)}</select></div>
      <DataTable rows={rows} emptyTitle="No payslips found" description="Payslips will appear when available." onRowClick={(slip) => setSelectedId(slip.id)} columns={[
        { key: 'period', label: 'PAY PERIOD', render: (slip) => <span className="person-cell"><span className="payslip-icon"><ReceiptText size={17} /></span><span><strong>{new Date(Number(slip.year), Number(slip.month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><small>Statement #{slip.id}</small></span></span> },
        { key: 'user', label: 'EMPLOYEE', render: (slip) => <span className="employee-table-label">{slip.user?.name || `Employee #${slip.user_id}`}<small>{slip.user?.employee_code || ''}</small></span> },
        { key: 'total_earnings', label: 'EARNINGS', render: (slip) => formatMoney(slip.total_earnings) },
        { key: 'total_deduction', label: 'DEDUCTIONS', render: (slip) => formatMoney(slip.total_deduction) },
        { key: 'net_pay', label: 'NET PAY', render: (slip) => <strong>{formatMoney(slip.net_pay)}</strong> },
        { key: 'view', label: '', render: (slip) => <button className="table-icon-link" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(slip.id) }} aria-label={`View ${slip.user?.name || 'employee'} payslip`}><Eye size={17} /></button> },
      ]} />
      <Pagination meta={data.meta} onPage={setPage} />
    </Panel>
    <PayslipDetailDrawer id={selectedId} open={selectedId !== null} onClose={() => setSelectedId(null)} />
  </div>
}

export function PayslipDetailDrawer({ id, open, onClose }) {
  const [slip, setSlip] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const load = useCallback(() => {
    if (!id) return Promise.resolve()
    setLoading(true)
    setError(null)
    return api.payslip(id).then((result) => setSlip(result.payslip)).catch(setError).finally(() => setLoading(false))
  }, [id])
  useEffect(() => { if (open) load() }, [open, load])
  const period = slip && new Date(Number(slip.year), Number(slip.month) - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  return <Drawer title="Payslip details" open={open} onClose={onClose}>
    {loading ? <LoadingState label="Loading payslip details" /> : error ? <ErrorState error={error} onRetry={load} /> : slip && <div className="drawer-section">
      <div className="drawer-summary"><span>{slip.user?.name || `Employee #${slip.user_id}`}</span><strong>{period}</strong><small>{slip.user?.employee_code} · {slip.user?.department?.name || ''}</small></div>
      <dl className="detail-list"><div><dt>Statement number</dt><dd>#{slip.id}</dd></div><div><dt>Pay period</dt><dd>{slip.month}/{slip.year}</dd></div></dl>
      <div className="payslip-detail-rows"><div><span>Total earnings</span><strong>{formatMoney(slip.total_earnings)}</strong></div><div><span>Total deduction</span><strong className="deduction-value">{formatMoney(slip.total_deduction)}</strong></div><div className="net-pay-row"><span>Net pay</span><strong>{formatMoney(slip.net_pay)}</strong></div></div>
    </div>}
  </Drawer>
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
