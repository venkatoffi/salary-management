import React, { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Building2,
  CircleDollarSign,
  FileCheck2,
  UserRoundPlus,
  UserRoundPen,
} from 'lucide-react'

const activities = [
  { id: 1, icon: UserRoundPlus, message: 'A new employee joined the Engineering team.', time: '5 minutes ago' },
  { id: 2, icon: CircleDollarSign, message: 'A salary revision was approved for Priya Sharma.', time: '24 minutes ago' },
  { id: 3, icon: FileCheck2, message: 'September payslips were generated for Finance.', time: '1 hour ago' },
  { id: 4, icon: Building2, message: 'The Operations department details were updated.', time: '2 hours ago' },
  { id: 5, icon: UserRoundPen, message: 'Your profile information was updated.', time: 'Yesterday' },
  { id: 6, icon: UserRoundPlus, message: 'Three new employees were added to Sales and Marketing.', time: 'Yesterday' },
  { id: 7, icon: CircleDollarSign, message: 'A salary revision is waiting for your review.', time: 'Yesterday' },
  { id: 8, icon: FileCheck2, message: 'August payslips are ready to view.', time: '2 days ago' },
  { id: 9, icon: Building2, message: 'A new department head was assigned to IT.', time: '3 days ago' },
  { id: 10, icon: UserRoundPen, message: 'Employee contact details were updated.', time: '4 days ago' },
]

export function NotificationsPopover() {
  const [unreadIds, setUnreadIds] = useState(() => activities.map(({ id }) => id))
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const unreadCount = unreadIds.length

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function markAllAsRead() {
    setUnreadIds([])
  }

  return (
    <div className="notification-control" ref={rootRef}>
      <button
        className="icon-button notification-button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications, no unread notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-popover" role="dialog" aria-label="Notifications">
          <header className="notification-heading">
            <div><h2>Notifications</h2><span>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</span></div>
            <button className="notification-mark-read" type="button" onClick={markAllAsRead} disabled={!unreadCount}>Mark all as read</button>
          </header>
          {activities.length ? (
            <ul className="notification-list">
              {activities.map(({ id, icon: Icon, message, time }) => {
                const unread = unreadIds.includes(id)
                return <li className={`notification-item${unread ? ' notification-item--unread' : ''}`} key={id}>
                  <span className="notification-icon"><Icon size={16} /></span>
                  <span className="notification-copy"><span>{message}</span><time>{time}</time></span>
                  {unread && <span className="notification-unread-dot" aria-label="Unread" />}
                </li>
              })}
            </ul>
          ) : <p className="notification-empty">You’re all caught up. New activity will appear here.</p>}
        </section>
      )}
    </div>
  )
}
