import React from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      notify('Welcome back.')
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="login-brand"><span className="brand-mark">S</span>Salary<span className="brand-light">wise</span></div>
        <div className="login-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✦</div>
          <div className="art-dashboard"><div className="art-window-bar"><i /><i /><i /><span>People overview</span></div><div className="art-stat-row"><div><small>Team growth</small><b>+12.8%</b><div className="art-line" /></div><div className="art-avatar-row"><i /><i /><i /><i /><span>+24</span></div></div><div className="art-chart"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></div>
          <div className="art-note"><span className="art-check">✓</span><span><b>All in one place</b><small>Your people. Your insights.</small></span></div>
        </div>
        <div className="login-brand-copy"><h2>Great work starts<br />with great people.</h2><p>A clearer view of your people, payroll and progress.</p></div>
        <span className="login-copyright">© 2026 Salarywise, Inc.</span>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="mobile-login-brand"><span className="brand-mark">S</span>Salary<span className="brand-light">wise</span></div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in to your<br />workspace</h1>
          <p className="login-intro">Enter your work email and password to continue.</p>
          <form onSubmit={submit} className="login-form">
            <Field label="Work email" required>
              <span className="input-icon"><Mail size={17} /><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></span>
            </Field>
            <Field label="Password" required>
              <span className="input-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
            </Field>
            {error && <div className="form-alert" role="alert">{error}</div>}
            <div className="login-options"><label className="checkbox-label"><input type="checkbox" /> Keep me signed in</label><a href="mailto:people-ops@example.com">Need help?</a></div>
            <button className="button button--primary login-submit" disabled={submitting}>{submitting ? <><span className="spinner spinner--light" />Signing in…</> : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          <p className="login-security"><LockKeyhole size={14} /> Protected by secure, encrypted authentication</p>
        </div>
      </div>
    </div>
  )
}
