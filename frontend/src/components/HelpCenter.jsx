import React, { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { Drawer, Field } from './ui'
import { useToast } from '../context/ToastContext'

export function HelpCenter({ open, onClose }) {
  const notify = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const cleanSubject = subject.trim()
    const cleanMessage = message.trim()
    if (!cleanSubject || !cleanMessage) {
      setError('Enter a subject and message before sending.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      notify('Your help request was sent.')
      setSubject('')
      setMessage('')
      onClose()
    } catch {
      setError('Your request could not be sent. Please try again.')
      notify('Your help request could not be sent.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer title="Help Center" open={open} onClose={onClose} side="left">
      <form className="help-center-form" onSubmit={submit}>
        <div className="help-center-intro"><span className="help-center-mark"><LifeBuoy size={20} /></span><p>Tell our people operations team how we can help.</p></div>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <Field label="Subject" required>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} required />
        </Field>
        <Field label="Message" required>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} maxLength={2000} required />
        </Field>
        <div className="form-actions">
          <button type="button" className="button button--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Sending…' : 'Send request'}</button>
        </div>
      </form>
    </Drawer>
  )
}
