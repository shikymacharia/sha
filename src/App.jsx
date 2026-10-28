import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, HashRouter, Link, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Heart, MessageCircle, Minus, Moon, Plus, Search, ShoppingBag, Smartphone, Sun, Trash2, Truck, User, X } from 'lucide-react'
import './App.css'
import { defaultProducts } from './products.js'
import { AuthProvider, useAuth } from './auth.jsx'
import { AuthModal } from './AuthModal.jsx'
import { collection, db, onSnapshot, placeOrder } from './firebase.js'
import Account from './Account.jsx'
import Admin from './Admin.jsx'
import StkWait from './StkWait.jsx'

const WHATSAPP_NUMBER = '254791648289'
const FREE_SHIPPING_AT = 5000
const categories = ['All', 'Shirts', 'Tees & Polos', 'Trousers', 'Jackets & Hoodies']
const sizes = ['S', 'M', 'L', 'XL', 'XXL']
const paymentMethods = ['M-Pesa', 'Cash on Delivery']
const wa = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
const money = (n) => `KSh ${Math.round(n).toLocaleString()}`

// Safe localStorage: never throws (private mode, quota).
const store = {
  get: (k, fallback) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v) } catch { return fallback } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } },
}

function Photo({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <img src={failed ? '/logo.webp' : src} alt={alt} className={`${className || ''} ${failed ? 'fallback' : ''}`}
      loading="lazy" decoding="async" width="600" height="750" onError={() => setFailed(true)} />
  )
}

function ProductCard({ p, saved, onSave, onAdd }) {
  const [size, setSize] = useState(null)
  const off = Math.round((1 - p.price / p.originalPrice) * 100)
  const left = typeof p.qty === 'number' ? p.qty : null
  const soldOut = left === 0
  const low = left !== null ? left > 0 && left <= 5 : p.stock === 'Low Stock'
  return (
    <motion.article layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card">
      <div className="media">
        <Photo src={p.image} alt={p.name} />
        <Photo src={p.hoverImage} alt={`${p.name}, alternate view`} className="alt" />
        <div className="tags">
          {p.badge && <span className="tag">{p.badge}</span>}
          {soldOut ? <span className="tag warn">Sold out</span> : low && <span className="tag warn">{left !== null ? `Only ${left} left` : 'Low stock'}</span>}
        </div>
        <button className="heart" aria-pressed={saved} aria-label={`Save ${p.name}`} onClick={() => onSave(p.id)}><Heart size={17} /></button>
      </div>
      <div className="info">
        <div className="row">
          <div><span className="cat">{p.brand ? `${p.brand} · ${p.category}` : p.category}</span><h3>{p.name}</h3></div>
          <div className="price">{money(p.price)}<s>{money(p.originalPrice)}</s></div>
        </div>
        <p className="desc">{p.description}{off > 0 && <> <b className="gold-text">Save {off}%.</b></>}</p>
        <div className="sizes" role="group" aria-label="Size">
          {(p.sizes || sizes).map((s) => <button key={s} className="size" aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>)}
        </div>
        <button className="btn btn-gold" disabled={!size || soldOut} onClick={() => onAdd(p.id, size)}>{soldOut ? 'Sold out' : size ? `Add size ${size} to cart` : 'Select a size'}</button>
      </div>
    </motion.article>
  )
}

function Cart({ lines, subtotal, onClose, onQty, onSize, onRemove, user, onLogin, onDone }) {
  const [waiting, setWaiting] = useState(null)
  const saved = useMemo(() => store.get('sha-contact', {}), [])
  const [name, setName] = useState(saved.name || user?.displayName || '')
  const [phone, setPhone] = useState(saved.phone || '')
  const [place, setPlace] = useState(saved.place || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [method, setMethod] = useState('M-Pesa')
  const [mode, setMode] = useState('full')
  const dueNow = method === 'M-Pesa' && mode === 'half' ? subtotal / 2 : subtotal
  const balance = method === 'M-Pesa' && mode === 'half' ? subtotal - dueNow : 0
  const left = FREE_SHIPPING_AT - subtotal

  const checkout = async (guest) => {
    let ref = ''
    if (!guest) {
      if (!name.trim() || !phone.trim() || !place.trim()) return setErr('Add your name, phone number and delivery location.')
      setBusy(true); setErr('')
      try {
        const r = await placeOrder({ items: lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty })), name, email: user?.email, phone, place, method, mode })
        ref = r.data.id
        store.set('sha-contact', { name, phone, place })
        if (r.data.stk) { setBusy(false); return setWaiting({ id: ref, token: r.data.token }) }
      } catch (e) { setBusy(false); return setErr(e.message || 'Could not place the order.') }
      setBusy(false)
    }
    const items = lines.map((l) => `• ${l.name} (size ${l.size}) x${l.qty} — ${money(l.price * l.qty)}`).join('\n')
    const pay = method === 'M-Pesa'
      ? `Payment: M-Pesa (${mode === 'full' ? 'full amount' : 'half now'})\nPay now: ${money(dueNow)}${balance ? `\nBalance on delivery: ${money(balance)}` : ''}\nPlease share the Till/Paybill number.`
      : 'Payment: Cash on Delivery'
    window.open(wa(`Hello HADAR Menswear, I'd like to order${ref ? ` (order #${ref})` : ''}:\n\n${items}\n\nTotal: ${money(subtotal)}\n${pay}`), '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      {waiting && <StkWait order={waiting} onClose={() => setWaiting(null)} onPaid={() => { onDone(); setWaiting(null); onClose() }} />}
      <motion.aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <header><h3>Your cart</h3><button className="icon-btn" aria-label="Close cart" onClick={onClose}><X size={18} /></button></header>
        <div className="lines">
          {lines.length === 0 && <div className="empty"><ShoppingBag size={26} /><p>Your cart is empty.</p></div>}
          {lines.map((l) => (
            <div className="line" key={l.key}>
              <img src={l.image} alt="" onError={(e) => { e.currentTarget.src = '/logo.webp' }} />
              <div className="meta">
                <b>{l.name}</b>
                <small>{money(l.price)} each · <label>Size <select className="size-pick" aria-label={`Size for ${l.name}`} value={l.size} onChange={(e) => onSize(l.key, e.target.value)}>
                  {(l.sizes || sizes).map((z) => <option key={z}>{z}</option>)}</select></label></small>
                <div className="qty">
                  <button aria-label="Decrease" onClick={() => onQty(l.key, -1)}><Minus size={14} /></button>
                  <span aria-live="polite">{l.qty}</span>
                  <button aria-label="Increase" onClick={() => onQty(l.key, 1)}><Plus size={14} /></button>
                </div>
              </div>
              <div className="end"><b>{money(l.price * l.qty)}</b>
                <button className="icon-btn rm" aria-label={`Remove ${l.name}`} onClick={() => onRemove(l.key)}><Trash2 size={15} /></button></div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="foot">
            <div className="seg" role="group" aria-label="Payment method">
              {paymentMethods.map((m) => <button key={m} aria-pressed={method === m} onClick={() => setMethod(m)}>{m}</button>)}
            </div>
            {method === 'M-Pesa' && (
              <div className="seg" role="group" aria-label="M-Pesa amount">
                <button aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Pay full</button>
                <button aria-pressed={mode === 'half'} onClick={() => setMode('half')}>Pay half now</button>
              </div>
            )}
            {balance > 0 && <p className="note">Balance of {money(balance)} is paid on delivery.</p>}
            <div><div className="bar"><i style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)}%` }} /></div>
              <p className="note" style={{ background: 'none', padding: '6px 0 0' }}><Truck size={12} style={{ display: 'inline' }} /> {left > 0 ? `${money(left)} away from free shipping` : 'Free shipping unlocked'}</p></div>
            <div className="sum"><span>{method === 'M-Pesa' ? 'Pay now' : 'Total'}</span><span>{money(dueNow)}</span></div>
            <input className="fld" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="fld" type="tel" placeholder="Phone, e.g. 0712345678" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="fld" placeholder="Delivery location" autoComplete="street-address" value={place} onChange={(e) => setPlace(e.target.value)} />
            {err && <p className="note" role="alert">{err}</p>}
            <button className="btn btn-gold" disabled={busy} onClick={() => checkout(false)}>{busy ? 'Placing order…' : method === 'M-Pesa' ? 'Place order & pay via M-Pesa' : 'Place order'}</button>
            {!user && <p className="note" style={{ background: 'none', padding: 0 }}>No account needed. <button className="link" onClick={onLogin}>Sign in</button> to track your orders.</p>}
            <button className="link" onClick={() => checkout(true)}>Or just send this order on WhatsApp</button>
          </div>
        )}
      </motion.aside>
    </>
  )
}

function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [dark, setDark] = useState(() => store.get('sha-theme', 'dark') === 'dark')
  const [wish, setWish] = useState(() => store.get('sha-wishlist', []))
  const [cart, setCart] = useState(() => store.get('sha-cart-v2', []))
  const [cartOpen, setCartOpen] = useState(false)
  const { user } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [remote, setRemote] = useState(null)
  useEffect(() => {
    if (!db) {
      setRemote(defaultProducts)
      return undefined
    }
    return onSnapshot(collection(db, 'products'), (q) => setRemote(q.docs.map((d) => ({ ...d.data(), id: d.id }))), () => {})
  }, [])

  const category = params.get('category') || 'All'
  const brand = params.get('brand') || 'All'
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'featured'
  const maxPrice = Number(params.get('maxPrice') || 8000)

  // Live products from Firestore; falls back to the built-in starter list when the database is empty or unavailable.
  const products = remote?.length ? remote : defaultProducts

  useEffect(() => { document.documentElement.classList.toggle('light', !dark); store.set('sha-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => store.set('sha-wishlist', wish), [wish])
  useEffect(() => store.set('sha-cart-v2', cart), [cart])
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen])

  const setQuery = (next) => {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => (!v || v === 'All' || v === 'featured' || v === 8000 ? p.delete(k) : p.set(k, String(v))))
    setParams(p, { replace: true })
  }

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products])
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter((p) => (category === 'All' || p.category === category) && (brand === 'All' || p.brand === brand) && p.price <= maxPrice &&
      (!q || `${p.name} ${p.brand || ''} ${p.description} ${p.category}`.toLowerCase().includes(q)))
    const by = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating }[sort]
    return by ? [...list].sort(by) : list
  }, [products, category, brand, search, sort, maxPrice])

  // Cart stores only id + size + qty; names and prices are always read from current product data.
  // Cart fields (key, id, size, qty) must win over product fields: products also have a stock `qty`.
  const lines = cart.map((c) => ({ ...products.find((p) => p.id === c.id), ...c })).filter((l) => l.name)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0)

  const add = (id, size) => { setCart((c) => { const key = `${id}-${size}`; return c.some((l) => l.key === key) ? c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)) : [...c, { key, id, size, qty: 1 }] }); setCartOpen(true) }
  const changeQty = (key, d) => setCart((c) => c.map((l) => {
    if (l.key !== key) return l
    const p = products.find((x) => x.id === l.id), max = typeof p?.qty === 'number' ? p.qty : 20
    return { ...l, qty: Math.min(max, l.qty + d) }
  }).filter((l) => l.qty > 0))
  const removeLine = (key) => setCart((c) => c.filter((l) => l.key !== key))
  // Changing size re-keys the line; if that size is already in the cart the two lines merge.
  const changeSize = (key, size) => setCart((c) => {
    const line = c.find((l) => l.key === key); if (!line || line.size === size) return c
    const nk = `${line.id}-${size}`, p = products.find((x) => x.id === line.id), max = typeof p?.qty === 'number' ? p.qty : 20
    const other = c.find((l) => l.key === nk)
    const merged = { ...line, key: nk, size, qty: Math.min(max, line.qty + (other ? other.qty : 0)) }
    return c.filter((l) => l.key !== nk).map((l) => (l.key === key ? merged : l))
  })
  const toggleWish = (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))

  return (
    <>
      <div className="topbar"><b>M-Pesa</b> accepted &nbsp;·&nbsp; Cash on delivery &nbsp;·&nbsp; Free shipping over {money(FREE_SHIPPING_AT)}</div>
      <header className="header"><div className="wrap">
        <a className="brand" href={import.meta.env.VITE_PREVIEW ? '#/shop' : '/shop'} aria-label="HADAR Menswear home">
          <img src="/logo.webp" alt="" width="48" height="48" />
          <div><div className="brand-name gold-text">HADAR</div><div className="brand-sub">Menswear</div></div>
        </a>
        <label className="search"><Search size={17} /><input type="search" aria-label="Search products" placeholder="Search shirts, denim, blazers…" value={search} onChange={(e) => setQuery({ search: e.target.value })} /></label>
        <div className="actions">
          <button className="icon-btn" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark((d) => !d)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          {user ? <Link className="icon-btn" to="/account" aria-label="My account"><User size={18} /></Link> : <button className="icon-btn" aria-label="Sign in" onClick={() => setAuthOpen(true)}><User size={18} /></button>}
          <button className="icon-btn" aria-label={`Open cart, ${count} items`} onClick={() => setCartOpen(true)}><ShoppingBag size={18} />{count > 0 && <span className="badge">{count}</span>}</button>
        </div>
      </div></header>

      <section className="hero"><div className="wrap">
        <div>
          <span className="eyebrow">Style · Confidence · Distinction</span>
          <h1>Dressed with <span className="gold-text">distinction.</span></h1>
          <p>Sharp shirts, easy denim and statement tailoring, made to be worn with confidence. Order in minutes on WhatsApp.</p>
          <div className="cta">
            <a className="btn btn-gold" href="#shop" onClick={(e) => { e.preventDefault(); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Shop the collection</a>
            <a className="btn btn-wa" href={wa('Hello HADAR Menswear, I would like to chat with your team.')} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Chat with us</a>
          </div>
        </div>
        <img className="hero-logo" src="/logo.webp" alt="HADAR Menswear crest" width="420" height="420" fetchPriority="high" />
      </div></section>

      <div className="trust">
        <div><Smartphone size={18} /> Pay with M-Pesa</div>
        <div><Banknote size={18} /> Cash on delivery</div>
        <div><MessageCircle size={18} /> Order on WhatsApp</div>
      </div>

      <main className="shop" id="shop"><div className="wrap">
        <span className="eyebrow">The collection</span>
        <h2>Curated by <span className="gold-text">HADAR</span></h2>
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Category">
            {categories.map((c) => <button key={c} className="chip" aria-pressed={category === c} onClick={() => setQuery({ category: c })}>{c}</button>)}
          </div>
          {brands.length > 1 && <div className="chips" role="group" aria-label="Brand">
            {['All', ...brands].map((b) => <button key={b} className="chip" aria-pressed={brand === b} onClick={() => setQuery({ brand: b })}>{b === 'All' ? 'All brands' : b}</button>)}
          </div>}
          <div className="filters">
            <label>Up to {money(maxPrice)} <input type="range" min="800" max="8000" step="100" value={maxPrice} onChange={(e) => setQuery({ maxPrice: Number(e.target.value) })} /></label>
            <select aria-label="Sort by" value={sort} onChange={(e) => setQuery({ sort: e.target.value })}>
              <option value="featured">Featured</option><option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option><option value="rating">Top rated</option>
            </select>
          </div>
        </div>
        <div className="grid">
          {shown.map((p) => <ProductCard key={p.id} p={p} saved={wish.includes(p.id)} onSave={toggleWish} onAdd={add} />)}
          {shown.length === 0 && <div className="empty">No pieces match your filters. <button className="link" onClick={() => setParams({}, { replace: true })}>Clear filters</button></div>}
        </div>
      </div></main>

      <footer className="footer"><div className="wrap">
        <img src="/logo.webp" alt="HADAR Menswear" width="96" height="96" loading="lazy" />
        <p>© {new Date().getFullYear()} HADAR Menswear. Style · Confidence · Distinction.</p>
        <a className="btn btn-wa" href={wa('Hello HADAR Menswear, I would like to chat with your team.')} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp us</a>
      </div></footer>

      <AnimatePresence>{cartOpen && <Cart lines={lines} subtotal={subtotal} onClose={() => setCartOpen(false)} onQty={changeQty} onSize={changeSize} onRemove={removeLine} user={user} onLogin={() => setAuthOpen(true)} onDone={() => setCart([])} />}</AnimatePresence>
      {authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}

export default function App() {
  const Router = import.meta.env.VITE_PREVIEW ? HashRouter : BrowserRouter
  return (
    <AuthProvider><Router>
      <Routes>
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </Router></AuthProvider>
  )
}
