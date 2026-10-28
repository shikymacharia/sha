import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { collection, db, onSnapshot, query, where } from './firebase.js'
import { isAdmin, useAuth } from './auth.jsx'

const money = (n) => `KSh ${Math.round(n).toLocaleString()}`

export default function Account() {
  const { user, loading, logout, resend } = useAuth()
  const [orders, setOrders] = useState([])
  const [sent, setSent] = useState(false)
  useEffect(() => {
    if (!user || !db) {
      setOrders([])
      return undefined
    }
    return onSnapshot(query(collection(db, 'orders'), where('uid', '==', user.uid)),
      (q) => setOrders(q.docs.map((d) => d.data()).sort((a, b) => (b.created?.seconds || 0) - (a.created?.seconds || 0))), () => {})
  }, [user])
  if (loading) return null
  if (!user) return <Navigate to="/shop" replace />
  return (
    <main className="acct">
      <Link className="link" to="/shop">← Back to shop</Link>
      <h2>Hi, {user.displayName || 'there'}</h2>
      <p className="note">{user.email}</p>
      {!user.emailVerified && <p className="note">Your email isn't verified yet. Check your inbox. <button className="link" disabled={sent} onClick={() => resend().then(() => setSent(true))}>{sent ? 'Sent' : 'Resend link'}</button></p>}
      {isAdmin(user) && <Link className="btn btn-gold" to="/admin">Open admin dashboard</Link>}
      <h3>Your orders</h3>
      {orders.length === 0 && <p className="note">No orders yet.</p>}
      {orders.map((o) => (
        <div className="ord" key={o.id}>
          <b>Order #{o.id} · {o.status}</b>
          <small>{o.created?.toDate().toLocaleString()} · {o.method} · {money(o.total)}</small>
          {o.lines.map((l, i) => <span key={i}>{l.name}, size {l.size} × {l.qty}</span>)}
        </div>
      ))}
      <button className="btn" onClick={logout}>Log out</button>
    </main>
  )
}
