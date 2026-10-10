import React from 'react'
import {
  Bell,
  Building2,
  CircleUserRound,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { initials } from '../components/ui'
import { HelpCenter } from '../components/HelpCenter'
import { NotificationsPopover } from '../components/NotificationsPopover'
import { navigationFor } from '../utils/permissions'

const icons = { LayoutDashboard, UsersRound, Building2, WalletCards, History, ReceiptText, CircleUserRound }

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const nav = navigationFor(user)

  async function handleLogout() {
    await logout()
    window.location.assign('/login')
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Salary<span className="brand-light">wise</span></span>
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="workspace-switch"><span className="workspace-logo">N</span><span><strong>Northstar Group</strong><small>People & Finance</small></span><span className="switch-chevron">⌄</span></div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = icons[item.icon]
            return <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}><Icon size={18} /><span>{item.label}</span>{item.label === 'Employees' && <span className="nav-dot" />}</NavLink>
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">?</span><strong>Need a hand?</strong><p>Visit the people ops help center.</p><button type="button" onClick={() => setHelpOpen(true)}>Open help center <span>↗</span></button></div>
          <div className="sidebar-user">
            <NavLink
              to="/profile"
              end
              aria-label={`View profile for ${user?.name}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `sidebar-user-link ${isActive ? 'sidebar-user-link--active' : ''}`}
            >
              <span className="avatar avatar--sidebar">{initials(user?.name)}</span>
              <span className="sidebar-user-copy"><strong>{user?.name}</strong><small>{user?.role_name}</small></span>
            </NavLink>
            <button className="icon-button logout-button" onClick={handleLogout} aria-label="Log out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="topbar-date">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <NotificationsPopover />
            <NavLink to="/profile" className="topbar-profile"><span className="avatar avatar--top">{initials(user?.name)}</span><span>{user?.name?.split(' ')[0]}</span><CircleUserRound size={15} /></NavLink>
          </div>
        </header>
        <main className="content"><Outlet /></main>
        <footer className="app-footer"><span>© 2026 Salarywise</span><span>People operations, made clearer.</span></footer>
      </div>
      <HelpCenter open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
