import React from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, ShieldAlert, X } from 'lucide-react'

export function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, caption, icon: Icon, tone = 'blue' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon--${tone}`}><Icon size={20} strokeWidth={2} /></div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{caption}</small></div>
    </article>
  )
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function LoadingState({ label = 'Loading data' }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}…</div>
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-card state-card--error" role="alert">
      <ShieldAlert size={22} />
      <div><strong>We couldn’t load this information.</strong><p>{error?.message || 'Please try again.'}</p></div>
      {onRetry && <button className="button button--secondary button--small" onClick={onRetry}>Retry</button>}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', description = 'Try changing your filters.' }) {
  return <div className="empty-state"><div className="empty-state-mark">—</div><strong>{title}</strong><p>{description}</p></div>
}

export function DataTable({ columns, rows, rowKey = 'id', emptyTitle, emptyDescription }) {
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.total <= meta.per_page) return null
  const pages = Math.max(1, Math.ceil(meta.total / meta.per_page))
  return (
    <div className="pagination">
      <span>Showing {Math.min((meta.page - 1) * meta.per_page + 1, meta.total)}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}</span>
      <div>
        <button className="icon-button" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1} aria-label="Previous page"><ChevronLeft size={18} /></button>
        <span className="pagination-current">Page {meta.page} of {pages}</span>
        <button className="icon-button" onClick={() => onPage(meta.page + 1)} disabled={meta.page >= pages} aria-label="Next page"><ChevronRight size={18} /></button>
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return <label className="search-box"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>
}

export function Field({ label, error, hint, children, required }) {
  return (
    <label className="field">
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export function Modal({ title, open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        {children}
      </section>
    </div>
  )
}

export function Permission({ allowed, children, fallback = null }) {
  return allowed ? children : fallback
}

export function LinkButton({ to, children, variant = 'primary', ...props }) {
  return <Link className={`button button--${variant}`} to={to} {...props}>{children}</Link>
}

export function formatMoney(value, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}
