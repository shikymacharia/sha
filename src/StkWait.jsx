import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderStatus } from './firebase.js'

// Full-screen status while the customer approves the M-Pesa prompt on their phone.
export default function StkWait({ order, onPaid, onClose }) {
  const { id, token } = order
  const [o, setO] = useState(null)
  // Polls every 3s; works for guests because the order token (not a login) authorises it.
  useEffect(() => {
    let on = true
    const tick = () => orderStatus({ id, token }).then((r) => on && setO(r.data)).catch(() => {})
    tick(); const t = setInterval(tick, 3000)
    return () => { on = false; clearInterval(t) }
  }, [id, token])
  const st = o?.status || 'awaiting payment'
  const paid = ['paid', 'payment to verify'].includes(st), failed = st === 'failed'
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="M-Pesa payment">
      <div className="auth" style={{ textAlign: 'center', margin: '0 auto' }}>
        {!paid && !failed && <><h3>Check your phone</h3><p className="note" aria-live="polite">An M-Pesa prompt was sent to {o?.phone || 'your phone'} for order #{id}. Enter your PIN to pay. This page updates by itself.</p></>}
        {st === 'paid' && <><h3>Payment received</h3><p className="note">M-Pesa code {o.mpesaCode}. We'll confirm delivery details soon.</p></>}
        {st === 'payment to verify' && <><h3>Payment received</h3><p className="note">We're verifying the amount and will be in touch.</p></>}
        {failed && <><h3>Payment not completed</h3><p className="note">{o?.note || 'The prompt was cancelled or timed out.'} You have not been charged.</p></>}
        {paid && <><button className="btn btn-gold" onClick={onPaid}>Done</button><Link className="link" to="/account">View my orders</Link></>}
        {failed && <button className="btn btn-gold" onClick={onClose}>Try again</button>}
        {!paid && !failed && <button className="link" onClick={onClose}>Close (payment can still complete)</button>}
      </div>
    </div>
  )
}
