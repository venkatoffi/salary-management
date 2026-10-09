import React from 'react'
import { ArrowLeft, Home, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return <div className="status-page"><div className="status-page-icon"><ShieldX size={28} /></div><p className="eyebrow">ACCESS RESTRICTED</p><h1>You don’t have access to this page</h1><p>Your account doesn’t have permission to view this resource. If you think this is a mistake, contact your workspace administrator.</p><Link to="/" className="button button--primary"><Home size={16} /> Return to overview</Link></div>
}

export function NotFoundPage() {
  return <div className="status-page"><div className="status-page-icon">404</div><p className="eyebrow">PAGE NOT FOUND</p><h1>This page seems to be missing</h1><p>The page may have moved or you may have followed an outdated link.</p><Link to="/" className="button button--primary"><ArrowLeft size={16} /> Back to overview</Link></div>
}
