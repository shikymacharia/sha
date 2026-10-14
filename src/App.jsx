import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Minus, MessageCircle, Moon, Plus, Search, ShoppingBag, Sun, Truck, Smartphone, Banknote, X } from 'lucide-react'
import './App.css'

const WHATSAPP_NUMBER = '254791648289'
const FREE_SHIPPING_AT = 5000
const categories = ['All', 'Essentials', 'Active', 'Layering', 'Streetwear']
const sizes = ['S', 'M', 'L', 'XL', 'XXL']
const paymentMethods = ['M-Pesa', 'Cash on Delivery']
const wa = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
const money = (n) => `KSh ${Math.round(n).toLocaleString()}`

const defaultProducts = [
  {
    id: 1,
    name: 'Classic White Shirt',
    price: 1800,
    originalPrice: 2300,
    category: 'Essentials',
    rating: 4.9,
    stock: 'Low Stock',
    badge: 'New',
    description: 'Clean, tailored fit for elevated daily workwear.',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Casual Denim',
    price: 2400,
    originalPrice: 3000,
    category: 'Streetwear',
    rating: 4.8,
    stock: 'Low Stock',
    badge: 'Popular',
    description: 'Relaxed denim built for comfort and movement.',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Premium Hoodie',
    price: 2900,
    originalPrice: 3600,
    category: 'Layering',
    rating: 5.0,
    stock: 'In Stock',
    badge: 'New',
    description: 'A soft heavyweight hoodie with an urban finish.',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'Oxford Layer',
    price: 2600,
    originalPrice: 3300,
    category: 'Layering',
    rating: 4.7,
    stock: 'Low Stock',
    badge: 'New',
    description: 'Sharp layering essential for modern business looks.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    name: 'Flex Active Set',
    price: 3100,
    originalPrice: 3900,
    category: 'Active',
    rating: 4.9,
    stock: 'In Stock',
    badge: 'Popular',
    description: 'Performance-ready layering for movement and recovery.',
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    name: 'Night Out Blazer',
    price: 4200,
    originalPrice: 5200,
    category: 'Essentials',
    rating: 5.0,
    stock: 'In Stock',
    badge: 'Elite',
    description: 'Statement tailoring for evening confidence and polish.',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
]

// Safe localStorage: never throws (private mode, quota).
const store = {
  get: (k, fallback) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v) } catch { return fallback } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } },
}

// Shrink uploaded photos so they fit in localStorage.
const shrink = (file) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const s = Math.min(1, 900 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = img.width * s; c.height = img.height * s
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    resolve(c.toDataURL('image/jpeg', 0.82))
  }
  img.src = URL.createObjectURL(file)
})

function Photo({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <img src={failed ? '/logo.webp' : src} alt={alt} className={`${className || ''} ${failed ? 'fallback' : ''}`}
      loading="lazy" decoding="async" width="600" height="750" onError={() => setFailed(true)} />
  )
}

function ProductCard({ p, saved, onSave, onAdd, seller, onEdit }) {
  const [size, setSize] = useState(null)
  const off = Math.round((1 - p.price / p.originalPrice) * 100)
  return (
    <motion.article layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card">
      <div className="media">
        <Photo src={p.image} alt={p.name} />
        <Photo src={p.hoverImage} alt={`${p.name}, alternate view`} className="alt" />
        <div className="tags">
          {p.badge && <span className="tag">{p.badge}</span>}
          {p.stock === 'Low Stock' && <span className="tag warn">Low stock</span>}
        </div>
        <button className="heart" aria-pressed={saved} aria-label={`Save ${p.name}`} onClick={() => onSave(p.id)}><Heart size={17} /></button>
      </div>
      <div className="info">
        <div className="row">
          <div><span className="cat">{p.category}</span><h3>{p.name}</h3></div>
          <div className="price">{money(p.price)}<s>{money(p.originalPrice)}</s></div>
        </div>
        <p className="desc">{p.description}{off > 0 && <> <b className="gold-text">Save {off}%.</b></>}</p>
        <div className="sizes" role="group" aria-label="Size">
          {sizes.map((s) => <button key={s} className="size" aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>)}
        </div>
        <button className="btn btn-gold" disabled={!size} onClick={() => onAdd(p.id, size)}>{size ? `Add size ${size} to cart` : 'Select a size'}</button>
        {seller && <button className="link" onClick={() => onEdit(p)}>Edit photos</button>}
      </div>
    </motion.article>
  )
}

function Cart({ lines, subtotal, onClose, onQty }) {
  const [method, setMethod] = useState('M-Pesa')
  const [mode, setMode] = useState('full')
  const dueNow = method === 'M-Pesa' && mode === 'half' ? subtotal / 2 : subtotal
  const balance = method === 'M-Pesa' && mode === 'half' ? subtotal - dueNow : 0
  const left = FREE_SHIPPING_AT - subtotal

  const checkout = () => {
    const items = lines.map((l) => `• ${l.name} (size ${l.size}) x${l.qty} — ${money(l.price * l.qty)}`).join('\n')
    const pay = method === 'M-Pesa'
      ? `Payment: M-Pesa (${mode === 'full' ? 'full amount' : 'half now'})\nPay now: ${money(dueNow)}${balance ? `\nBalance on delivery: ${money(balance)}` : ''}\nPlease share the Till/Paybill number.`
      : 'Payment: Cash on Delivery'
    window.open(wa(`Hello HADAR Menswear, I'd like to order:\n\n${items}\n\nTotal: ${money(subtotal)}\n${pay}`), '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <header><h3>Your cart</h3><button className="icon-btn" aria-label="Close cart" onClick={onClose}><X size={18} /></button></header>
        <div className="lines">
          {lines.length === 0 && <div className="empty"><ShoppingBag size={26} /><p>Your cart is empty.</p></div>}
          {lines.map((l) => (
            <div className="line" key={l.key}>
              <img src={l.image} alt="" onError={(e) => { e.currentTarget.src = '/logo.webp' }} />
              <div className="meta">
                <b>{l.name}</b><small>Size {l.size} · {money(l.price)}</small>
                <div className="qty">
                  <button aria-label="Decrease" onClick={() => onQty(l.key, -1)}><Minus size={14} /></button>
                  <span aria-live="polite">{l.qty}</span>
                  <button aria-label="Increase" onClick={() => onQty(l.key, 1)}><Plus size={14} /></button>
                </div>
              </div>
              <b>{money(l.price * l.qty)}</b>
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
            <button className="btn btn-gold" onClick={checkout}>{method === 'M-Pesa' ? 'Order & pay via M-Pesa' : 'Confirm order on WhatsApp'}</button>
          </div>
        )}
      </motion.aside>
    </>
  )
}

function PhotoManager({ product, onChange, onClose }) {
  const upload = async (field, e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (f) onChange(product.id, field, await shrink(f))
  }
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Photo manager" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="row"><h3 style={{ fontFamily: 'var(--display)', fontSize: 26, margin: 0 }}>{product.name}</h3>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        <div className="two">
          {[['image', 'Main photo'], ['hoverImage', 'Hover photo']].map(([f, label]) => (
            <div key={f}><span className="eyebrow">{label}</span>
              <img src={product[f]} alt="" />
              <input type="url" value={product[f].startsWith('data:') ? '' : product[f]} placeholder="https://…" onChange={(e) => onChange(product.id, f, e.target.value)} />
              <label className="btn">Upload<input type="file" accept="image/*" hidden onChange={(e) => upload(f, e)} /></label>
            </div>
          ))}
        </div>
        <p className="note">Photos are saved in this browser only. Other visitors won't see them until they are added to the site's code or a database.</p>
      </div>
    </div>
  )
}

function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [dark, setDark] = useState(() => store.get('sha-theme', 'dark') === 'dark')
  const [photos, setPhotos] = useState(() => store.get('sha-photos', {}))
  const [wish, setWish] = useState(() => store.get('sha-wishlist', []))
  const [cart, setCart] = useState(() => store.get('sha-cart-v2', []))
  const [cartOpen, setCartOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const category = params.get('category') || 'All'
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'featured'
  const maxPrice = Number(params.get('maxPrice') || 5000)
  const seller = params.get('seller') === 'true'

  // Products always come from code; only photo overrides are stored locally, so price changes reach everyone.
  const products = useMemo(() => defaultProducts.map((p) => ({ ...p, ...photos[p.id] })), [photos])

  useEffect(() => { document.documentElement.classList.toggle('light', !dark); store.set('sha-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => store.set('sha-photos', photos), [photos])
  useEffect(() => store.set('sha-wishlist', wish), [wish])
  useEffect(() => store.set('sha-cart-v2', cart), [cart])
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && (setCartOpen(false), setEditing(null))
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen])

  const setQuery = (next) => {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => (!v || v === 'All' || v === 'featured' || v === 5000 ? p.delete(k) : p.set(k, String(v))))
    setParams(p, { replace: true })
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter((p) => (category === 'All' || p.category === category) && p.price <= maxPrice &&
      (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)))
    const by = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating }[sort]
    return by ? [...list].sort(by) : list
  }, [products, category, search, sort, maxPrice])

  // Cart stores only id + size + qty; names and prices are always read from current product data.
  const lines = cart.map((c) => ({ ...c, ...products.find((p) => p.id === c.id) })).filter((l) => l.name)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0)

  const add = (id, size) => { setCart((c) => { const key = `${id}-${size}`; return c.some((l) => l.key === key) ? c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)) : [...c, { key, id, size, qty: 1 }] }); setCartOpen(true) }
  const changeQty = (key, d) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0))
  const toggleWish = (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))
  const setPhoto = (id, field, value) => setPhotos((s) => ({ ...s, [id]: { ...s[id], [field]: value } }))

  return (
    <>
      <div className="topbar"><b>M-Pesa</b> accepted &nbsp;·&nbsp; Cash on delivery &nbsp;·&nbsp; Free shipping over {money(FREE_SHIPPING_AT)}</div>
      <header className="header"><div className="wrap">
        <a className="brand" href="/shop" aria-label="HADAR Menswear home">
          <img src="/logo.webp" alt="" width="48" height="48" />
          <div><div className="brand-name gold-text">HADAR</div><div className="brand-sub">Menswear</div></div>
        </a>
        <label className="search"><Search size={17} /><input type="search" aria-label="Search products" placeholder="Search shirts, denim, blazers…" value={search} onChange={(e) => setQuery({ search: e.target.value })} /></label>
        <div className="actions">
          <button className="icon-btn" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark((d) => !d)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="icon-btn" aria-label={`Open cart, ${count} items`} onClick={() => setCartOpen(true)}><ShoppingBag size={18} />{count > 0 && <span className="badge">{count}</span>}</button>
        </div>
      </div></header>

      <section className="hero"><div className="wrap">
        <div>
          <span className="eyebrow">Style · Confidence · Distinction</span>
          <h1>Dressed with <span className="gold-text">distinction.</span></h1>
          <p>Sharp shirts, easy denim and statement tailoring, made to be worn with confidence. Order in minutes on WhatsApp.</p>
          <div className="cta">
            <a className="btn btn-gold" href="#shop">Shop the collection</a>
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
          <div className="filters">
            <label>Up to {money(maxPrice)} <input type="range" min="1200" max="5000" step="100" value={maxPrice} onChange={(e) => setQuery({ maxPrice: Number(e.target.value) })} /></label>
            <select aria-label="Sort by" value={sort} onChange={(e) => setQuery({ sort: e.target.value })}>
              <option value="featured">Featured</option><option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option><option value="rating">Top rated</option>
            </select>
          </div>
        </div>
        <div className="grid">
          {shown.map((p) => <ProductCard key={p.id} p={p} saved={wish.includes(p.id)} onSave={toggleWish} onAdd={add} seller={seller} onEdit={setEditing} />)}
          {shown.length === 0 && <div className="empty">No pieces match your filters. <button className="link" onClick={() => setParams({}, { replace: true })}>Clear filters</button></div>}
        </div>
      </div></main>

      <footer className="footer"><div className="wrap">
        <img src="/logo.webp" alt="HADAR Menswear" width="96" height="96" loading="lazy" />
        <p>© {new Date().getFullYear()} HADAR Menswear. Style · Confidence · Distinction.</p>
        <a className="btn btn-wa" href={wa('Hello HADAR Menswear, I would like to chat with your team.')} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp us</a>
      </div></footer>

      <AnimatePresence>{cartOpen && <Cart lines={lines} subtotal={subtotal} onClose={() => setCartOpen(false)} onQty={changeQty} />}</AnimatePresence>
      {seller && editing && <PhotoManager product={products.find((p) => p.id === editing.id)} onChange={setPhoto} onClose={() => setEditing(null)} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
