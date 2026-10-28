import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, db, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from './firebase.js'
import { isAdmin, useAuth } from './auth.jsx'
import { defaultProducts } from './products.js'

const STATUSES = ['new', 'awaiting payment', 'payment to verify', 'paid', 'dispatched', 'delivered', 'cancelled', 'failed']
const money = (n) => `KSh ${Math.round(n || 0).toLocaleString()}`
const BLANK = { id: '', brand: '', sizesText: '', name: '', price: '', originalPrice: '', category: 'Essentials', stock: 'In Stock', qty: '', badge: '', rating: 5, description: '', image: '', hoverImage: '' }

export default function Admin() {
  const { user, loading } = useAuth()
  const ok = isAdmin(user)
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [prods, setProds] = useState([])
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState('')
  const [bulk, setBulk] = useState({ scope: 'all', mode: 'percent', value: '' })

  useEffect(() => {
    if (!ok || !db) {
      setOrders([])
      setProds([])
      return undefined
    }
    const err = (e) => setMsg(e.message)
    const a = onSnapshot(collection(db, 'orders'), (q) => setOrders(q.docs.map((d) => d.data()).sort((x, y) => (y.created?.seconds || 0) - (x.created?.seconds || 0))), err)
    const b = onSnapshot(collection(db, 'products'), (q) => setProds(q.docs.map((d) => ({ ...d.data(), id: d.id }))), err)
    return () => { a(); b() }
  }, [ok])

  if (loading) return null
  if (!ok) return <main className="acct"><h2>Admin</h2><p className="note">{user ? 'This account is not an admin, or its email is not verified.' : 'Please log in with an admin account.'}</p><Link className="link" to="/shop">← Back to shop</Link></main>

  const run = (p) => p.then(() => setMsg('')).catch((e) => setMsg(e.message))
  const setStatus = (id, status) => run(updateDoc(doc(db, 'orders', id), { status }))
  const saveProduct = (e) => {
    e.preventDefault()
    const id = form.id || `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
    const price = Math.round(+form.price), orig = Math.round(+form.originalPrice) || price
    if (!form.name.trim() || !(price > 0)) return setMsg('Name and a price above 0 are required.')
    const { qty, sizesText, ...rest } = form
    const sizes = String(sizesText || '').split(',').map((s) => s.trim()).filter(Boolean)
    const data = { ...rest, ...(sizes.length ? { sizes } : {}), id, price, originalPrice: Math.max(orig, price), rating: +form.rating || 5, name: form.name.trim() }
    if (qty !== '' && qty != null && !isNaN(+qty)) { data.qty = Math.max(0, Math.round(+qty)); data.stock = data.qty > 0 && data.qty <= 5 ? 'Low Stock' : 'In Stock' }
    run(setDoc(doc(db, 'products', id), data)).then(() => setForm(null))
  }
  const del = (p) => confirm(`Delete ${p.name}?`) && run(deleteDoc(doc(db, 'products', p.id)))
  // Sold out = stock count 0 (the shop and placeOrder both treat 0 as unavailable). Restocking asks for a count.
  const toggleSoldOut = (p) => {
    if (p.qty === 0) {
      const n = Math.round(+prompt(`Restock ${p.name} — how many are available?`, '10'))
      return n > 0 && run(updateDoc(doc(db, 'products', p.id), { qty: n, stock: n <= 5 ? 'Low Stock' : 'In Stock' }))
    }
    return run(updateDoc(doc(db, 'products', p.id), { qty: 0, stock: 'Sold out' }))
  }
  const categories = [...new Set(prods.map((p) => p.category).filter(Boolean))]
  const bulkTargets = prods.filter((p) => bulk.scope === 'all' || p.category === bulk.scope)
  const newPrice = (p) => Math.max(1, Math.round(bulk.mode === 'percent' ? p.price * (1 + +bulk.value / 100) : p.price + +bulk.value))
  const applyBulk = (e) => {
    e.preventDefault()
    if (!+bulk.value) return setMsg('Enter a change amount (use a minus sign to reduce prices).')
    const label = `${bulk.value > 0 ? '+' : ''}${bulk.value}${bulk.mode === 'percent' ? '%' : ' KSh'}`
    if (!confirm(`Change the price of ${bulkTargets.length} product(s) by ${label}?\nExample: ${bulkTargets[0]?.name} ${money(bulkTargets[0]?.price)} → ${money(newPrice(bulkTargets[0] || { price: 0 }))}`)) return
    // originalPrice never drops below the new price, so reductions show as a discount and increases stay consistent.
    run(Promise.all(bulkTargets.map((p) => { const price = newPrice(p); return updateDoc(doc(db, 'products', p.id), { price, originalPrice: Math.max(p.originalPrice || price, price) }) })))
      .then(() => setBulk({ ...bulk, value: '' }))
  }
  const seedDefaults = () => run(Promise.all(defaultProducts.map((p) => setDoc(doc(db, 'products', String(p.id)), p))))
  const f = (k) => ({ className: 'fld', value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) })
  const shown = orders.filter((o) => filter === 'all' || o.status === filter)
  const revenue = orders.filter((o) => ['paid', 'dispatched', 'delivered'].includes(o.status)).reduce((n, o) => n + (o.total || 0), 0)

  return (
    <main className="acct wide">
      <Link className="link" to="/shop">← Back to shop</Link>
      <h2>Admin dashboard</h2>
      <p className="note">{orders.length} orders · {orders.filter((o) => ['new', 'payment to verify', 'paid'].includes(o.status)).length} need action · {money(revenue)} confirmed sales</p>
      <div className="chips" role="group" aria-label="Section">
        {['orders', 'products'].map((t) => <button key={t} className="chip" aria-pressed={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {msg && <p className="note" role="alert">{msg}</p>}

      {tab === 'orders' && <>
        <select className="fld" aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {shown.length === 0 && <p className="note">No orders here.</p>}
        {shown.map((o) => (
          <div className="ord" key={o.id}>
            <div className="row"><b>#{o.id} · {o.name || o.email}</b>
              <select className="fld" style={{ width: 'auto' }} aria-label={`Status of order ${o.id}`} value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <small>{o.created?.toDate().toLocaleString()} · {o.method} · {money(o.total)}{o.dueNow < o.total ? ` (${money(o.dueNow)} now)` : ''}{o.mpesaCode ? ` · ${o.mpesaCode}` : ''}</small>
            {o.lines.map((l, i) => <span key={i}>{l.name}, size {l.size} × {l.qty}</span>)}
            <small>{o.place} · {o.phone} · {o.email}{o.note ? ` · ${o.note}` : ''}</small>
            <a className="link" href={`https://wa.me/${o.phone}`} target="_blank" rel="noreferrer">Message on WhatsApp</a>
          </div>
        ))}
      </>}

      {tab === 'products' && !form && <>
        <div><button className="btn btn-gold" onClick={() => setForm({ ...BLANK })}>Add product</button>{prods.length === 0 && <button className="btn" onClick={seedDefaults}>Load starter products</button>}</div>
        {prods.length > 0 && (
          <form className="ord" onSubmit={applyBulk}>
            <b>Bulk price change</b>
            <div className="row">
              <select className="fld" style={{ width: 'auto' }} aria-label="Products to change" value={bulk.scope} onChange={(e) => setBulk({ ...bulk, scope: e.target.value })}>
                <option value="all">All products ({prods.length})</option>{categories.map((c) => <option key={c} value={c}>{c} ({prods.filter((p) => p.category === c).length})</option>)}
              </select>
              <select className="fld" style={{ width: 'auto' }} aria-label="Change type" value={bulk.mode} onChange={(e) => setBulk({ ...bulk, mode: e.target.value })}>
                <option value="percent">Percent (%)</option><option value="amount">Amount (KSh)</option>
              </select>
              <input className="fld" style={{ width: 120 }} type="number" step="any" placeholder="e.g. -10" aria-label="Change amount" value={bulk.value} onChange={(e) => setBulk({ ...bulk, value: e.target.value })} />
              <button className="btn">Apply</button>
            </div>
            <small>Use a minus sign to reduce (−10 = 10% off). Original prices are kept so reductions show as discounts.</small>
          </form>
        )}
        {prods.map((p) => (
          <div className="ord" key={p.id}>
            <div className="row"><b>{p.name}{p.qty === 0 && ' · SOLD OUT'}</b><span>{money(p.price)}</span></div>
            <small>{p.brand ? `${p.brand} · ` : ''}{p.category}{p.sizes ? ` · sizes ${p.sizes.join('/')}` : ''} · {typeof p.qty === 'number' ? `${p.qty} in stock` : `${p.stock} (not counted)`}{p.badge ? ` · ${p.badge}` : ''}</small>
            <div><button className="link" onClick={() => setForm({ ...BLANK, ...p, sizesText: (p.sizes || []).join(', ') })}>Edit</button> · <button className="link" onClick={() => toggleSoldOut(p)}>{p.qty === 0 ? 'Restock' : 'Mark sold out'}</button> · <button className="link" onClick={() => del(p)}>Delete</button></div>
          </div>
        ))}
      </>}

      {tab === 'products' && form && (
        <form className="pform" onSubmit={saveProduct}>
          <input {...f('name')} placeholder="Name" required />
          <input {...f('category')} placeholder="Category (Shirts, Trousers…)" />
          <input {...f('brand')} placeholder="Brand (e.g. Benletti Homme)" />
          <input {...f('sizesText')} placeholder="Sizes available, e.g. S, M, L, XL" />
          <input {...f('price')} type="number" min="1" placeholder="Price KSh" required />
          <input {...f('originalPrice')} type="number" min="0" placeholder="Original price (optional)" />
          <input {...f('qty')} type="number" min="0" placeholder="Stock quantity (blank = not counted)" />
          <input {...f('badge')} placeholder="Badge (New, Popular…)" />
          <input {...f('image')} type="url" placeholder="Main image URL" />
          <input {...f('hoverImage')} type="url" placeholder="Hover image URL" />
          <textarea {...f('description')} placeholder="Description" rows={3} style={{ gridColumn: '1 / -1' }} />
          <div style={{ gridColumn: '1 / -1' }}><button className="btn btn-gold">Save</button><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
    </main>
  )
}
