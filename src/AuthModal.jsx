import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from './auth.jsx'

const MSG = { 'auth/invalid-credential': 'Wrong email or password.', 'auth/email-already-in-use': 'That email already has an account. Log in instead.',
  'auth/weak-password': 'Use a password of at least 6 characters.', 'auth/invalid-email': 'Enter a valid email address.', 'auth/too-many-requests': 'Too many attempts. Try again later.' }

export function AuthModal({ onClose }) {
  const { login, signup, reset } = useAuth()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', pw: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg('')
    try {
      if (mode === 'reset') { await reset(f.email); setMsg('If that email has an account, a reset link is on its way.') }
      else if (mode === 'signup') { if (!f.name.trim()) throw { message: 'Enter your name.' }; await signup(f.name.trim(), f.email, f.pw); onClose() }
      else { await login(f.email, f.pw); onClose() }
    } catch (x) { setMsg(MSG[x.code] || x.message || 'Something went wrong.') }
    setBusy(false)
  }
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Account" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <form className="auth" onSubmit={submit}>
          <div className="row"><h3>{{ login: 'Welcome back', signup: 'Create account', reset: 'Reset password' }[mode]}</h3>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
          {mode === 'signup' && <input className="fld" placeholder="Full name" autoComplete="name" value={f.name} onChange={set('name')} />}
          <input className="fld" type="email" placeholder="Email" autoComplete="email" required value={f.email} onChange={set('email')} />
          {mode !== 'reset' && <input className="fld" type="password" placeholder="Password" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={f.pw} onChange={set('pw')} />}
          {msg && <p className="note" role="alert">{msg}</p>}
          <button className="btn btn-gold" disabled={busy}>{busy ? 'Please wait…' : { login: 'Log in', signup: 'Sign up', reset: 'Send reset link' }[mode]}</button>
          {mode === 'login' && <><button type="button" className="link" onClick={() => setMode('signup')}>New here? Create an account</button>
            <button type="button" className="link" onClick={() => setMode('reset')}>Forgot password?</button></>}
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>Back to log in</button>}
        </form>
      </div>
    </div>
  )
}
