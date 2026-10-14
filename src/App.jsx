import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Moon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import './App.css'

const categories = ['All', 'Essentials', 'Active', 'Layering', 'Streetwear']
const paymentMethods = ['M-Pesa', 'Cash on Delivery']
const WHATSAPP_NUMBER = '254791648289'
const WHATSAPP_MESSAGE = encodeURIComponent('Hello HADAR MENSWEAR, I would like to chat with your team.')

const products = [
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
    accent: 'from-slate-700 via-slate-800 to-slate-900',
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
    accent: 'from-amber-500 via-orange-500 to-red-500',
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
    accent: 'from-violet-500 via-indigo-500 to-sky-500',
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
    accent: 'from-cyan-500 via-teal-500 to-emerald-500',
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
    accent: 'from-rose-500 via-pink-500 to-orange-500',
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
    accent: 'from-zinc-500 via-stone-500 to-neutral-800',
  },
]

const formatMoney = (amount) => `KSh ${amount.toLocaleString()}`

function BrandMark() {
  return (
    <svg className="brand-logo" viewBox="0 0 1000 500" role="img" aria-label="HADAR Menswear logo">
      <defs>
        <linearGradient id="goldGradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff1bc" />
          <stop offset="18%" stopColor="#f4d67a" />
          <stop offset="34%" stopColor="#d9a13e" />
          <stop offset="50%" stopColor="#f7e7a3" />
          <stop offset="68%" stopColor="#b7771d" />
          <stop offset="100%" stopColor="#f7e3ae" />
        </linearGradient>
        <linearGradient id="goldStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#f4d784" />
          <stop offset="50%" stopColor="#d29a37" />
          <stop offset="100%" stopColor="#f9e8b0" />
        </linearGradient>
      </defs>

      <circle cx="500" cy="250" r="214" fill="rgba(0,0,0,0.78)" stroke="url(#goldStroke)" strokeWidth="9" />
      <circle cx="500" cy="250" r="200" fill="rgba(0,0,0,0.28)" stroke="rgba(235, 191, 89, 0.4)" strokeWidth="1.5" />

      <g transform="translate(0 4)">
        <path d="M330 185 L365 110 L400 185 L430 110 L470 185 L500 98 L532 185 L565 110 L605 185 L640 110 L675 185" fill="none" stroke="url(#goldGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M385 170 L420 145 L440 170 L460 140 L500 170 L540 140 L560 170 L580 145 L615 170" fill="none" stroke="url(#goldGradient)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      </g>

      <g transform="translate(0 8)">
        <path d="M425 190 C455 180, 470 190, 500 210 C528 190, 548 180, 575 190 L595 220 C565 236, 530 250, 500 270 C470 250, 435 236, 405 220 Z" fill="url(#goldGradient)" opacity="0.7" />
      </g>

      <g transform="translate(0 8)">
        <path d="M445 215 L515 215 L500 245 C490 257, 485 270, 500 290 C515 270, 510 257, 500 245 Z" fill="url(#goldGradient)" opacity="0.9" />
        <path d="M440 192 L450 250 L470 250 L490 210 L510 250 L530 250 L540 192" fill="none" stroke="url(#goldGradient)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M500 160 L500 200" stroke="url(#goldGradient)" strokeWidth="12" strokeLinecap="round" />
      </g>

      <g fontFamily="Georgia, 'Times New Roman', serif" textAnchor="middle">
        <text x="500" y="255" fontSize="150" fontWeight="700" fill="url(#goldGradient)" letterSpacing="-10">H</text>
        <text x="500" y="355" fontSize="118" fontWeight="700" fill="url(#goldGradient)" letterSpacing="-8">HADAR</text>
        <text x="500" y="395" fontSize="34" fontWeight="700" fill="url(#goldGradient)" letterSpacing="11">MENSWEAR</text>
        <line x1="280" y1="410" x2="720" y2="410" stroke="url(#goldGradient)" strokeWidth="2.5" opacity="0.8" />
        <text x="500" y="445" fontSize="16" fontWeight="600" fill="url(#goldGradient)" letterSpacing="4">STYLE • CONFIDENCE • DISTINCTION</text>
      </g>
    </svg>
  )
}

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sha-theme')
    return saved ? saved === 'dark' : true
  })
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sha-wishlist') || '[]')
    } catch {
      return []
    }
  })
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sha-cart') || '[]')
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa')
  const [mpesaPaymentMode, setMpesaPaymentMode] = useState('full')

  const category = searchParams.get('category') || 'All'
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'featured'
  const maxPrice = Number(searchParams.get('maxPrice') || 5000)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('sha-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('sha-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('sha-wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  const updateQuery = (next) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'All' || value === 'featured' || value === '5000') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    setSearchParams(params)
  }

  const filteredProducts = useMemo(() => {
    let next = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      const matchesPrice = product.price <= maxPrice
      return matchesCategory && matchesSearch && matchesPrice
    })

    if (sort === 'price-asc') {
      next = [...next].sort((a, b) => a.price - b.price)
    }
    if (sort === 'price-desc') {
      next = [...next].sort((a, b) => b.price - a.price)
    }
    if (sort === 'rating') {
      next = [...next].sort((a, b) => b.rating - a.rating)
    }

    return next
  }, [category, search, sort, maxPrice])

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  )

  const shippingProgress = Math.min((subtotal / 5000) * 100, 100)

  const toggleWishlist = (productId) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId],
    )
  }

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  const checkoutMessage = cart.length
    ? cart.map((item) => `${item.name} x${item.quantity} - ${formatMoney(item.price * item.quantity)}`).join('%0A')
    : 'I would like to order from HADAR MENSWEAR.'

  const mpesaDueNow = mpesaPaymentMode === 'full' ? subtotal : subtotal / 2
  const balanceDueOnDelivery = paymentMethod === 'M-Pesa' && mpesaPaymentMode === 'half' ? subtotal - mpesaDueNow : 0

  const handleCheckout = () => {
    const orderSummary = `Hello HADAR MENSWEAR,%0A%0A${checkoutMessage}%0A%0ATotal: ${formatMoney(subtotal)}%0APayment Method: ${paymentMethod}`
    const message =
      paymentMethod === 'M-Pesa'
        ? `I would like to pay via M-Pesa for my order.%0A%0A${orderSummary}%0A%0APayment choice: ${mpesaPaymentMode === 'full' ? 'Full amount' : 'Half amount'}%0APay now: ${formatMoney(mpesaDueNow)}${mpesaPaymentMode === 'half' ? `%0ABalance due on delivery: ${formatMoney(balanceDueOnDelivery)}` : ''}%0A%0APlease share the M-Pesa Paybill/Till number or confirm the payment instructions.`
        : `I would like to pay on delivery for my order.%0A%0A${orderSummary}`

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="shop-shell min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-center text-xs font-medium text-slate-100 shadow-lg shadow-slate-900/10 md:flex-row md:text-sm">
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950">M-Pesa</span>
          <span>Pay with mobile money</span>
          <span className="hidden text-slate-500 md:inline">•</span>
          <span>Cash on Delivery available</span>
        </div>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(37,211,102,0.35)] transition hover:-translate-y-0.5"
      >
        <MessageCircle size={18} />
        <span>Chat with us</span>
      </a>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[28px] border border-slate-200/80 bg-white/70 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="select-none text-left">
                <div className="text-lg font-black uppercase tracking-[0.22em] text-slate-900 dark:text-white">HADAR</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.45em] text-amber-600 dark:text-amber-300">Menswear</div>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => updateQuery({ search: event.target.value })}
                  placeholder="Search jackets, shirts, essentials..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={() => setDarkMode((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
              >
                <ShoppingBag size={16} />
                Cart
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Filters</p>
                <h2 className="mt-1 text-xl font-bold">Shop</h2>
              </div>
              <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                <SlidersHorizontal size={16} />
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateQuery({ category: item === 'All' ? null : item })}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      category === item
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span>Price</span>
                <span>{formatMoney(maxPrice)}</span>
              </div>
              <input
                aria-label="Maximum price"
                type="range"
                min="1200"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(event) => updateQuery({ maxPrice: Number(event.target.value) })}
                className="range-input w-full"
              />
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sort by</label>
              <select
                value={sort}
                onChange={(event) => updateQuery({ sort: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg dark:from-slate-800 dark:to-slate-900">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span>Free shipping</span>
                <span className="font-semibold">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-300"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <Truck size={14} />
                <span>{subtotal >= 5000 ? 'Unlocked' : `${formatMoney(5000 - subtotal)} away`}</span>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Editorial selection</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">Curated by SHA</h2>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Sparkles size={15} className="text-amber-500" />
                  {filteredProducts.length} pieces available
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                      <div className="card-shimmer h-80 w-full" />
                      <div className="space-y-4 p-5">
                        <div className="card-shimmer h-4 w-1/3 rounded-full" />
                        <div className="card-shimmer h-6 w-2/3 rounded-full" />
                        <div className="card-shimmer h-4 w-full rounded-full" />
                        <div className="card-shimmer h-11 w-full rounded-full" />
                      </div>
                    </div>
                  ))
                : filteredProducts.map((product) => {
                    const saved = wishlist.includes(product.id)
                    const isLowStock = product.stock === 'Low Stock'

                    return (
                      <motion.article
                        layout
                        key={product.id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.26, ease: 'easeOut' }}
                        whileHover={{ y: -8 }}
                        className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_20px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="relative h-80 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <img
                            src={product.hoverImage}
                            alt={`${product.name} alternate view`}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent" />

                          <div className="absolute left-4 top-4 flex gap-2">
                            {product.badge && (
                              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                                {product.badge}
                              </span>
                            )}
                            {isLowStock && (
                              <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                Low Stock
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-slate-950/25 text-white shadow-md backdrop-blur-md transition hover:scale-105"
                            aria-label={`Toggle wishlist for ${product.name}`}
                          >
                            <Heart size={16} className={saved ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                          </button>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{product.category}</p>
                              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{product.name}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-amber-500">{formatMoney(product.price)}</p>
                              <p className="text-xs text-slate-400 line-through">{formatMoney(product.originalPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            <span>{product.rating}</span>
                            <span className="text-slate-400">•</span>
                            <span>{product.stock}</span>
                          </div>

                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{product.description}</p>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
                            >
                              Add to cart
                            </button>
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${product.accent} shadow-lg`} />
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
              aria-label="Close cart"
            />

            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', stiffness: 230, damping: 26 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-[0_0_60px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Cart</p>
                  <h3 className="mt-1 text-xl font-bold">{cartCount} items</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200"
                  aria-label="Close cart drawer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="mt-10 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
                    <ShoppingBag className="mx-auto mb-3 text-slate-400" size={28} />
                    <p className="text-sm text-slate-500 dark:text-slate-300">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                      <img src={item.image} alt={item.name} className="h-20 w-16 rounded-xl object-cover" loading="lazy" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatMoney(item.price)} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">x{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-red-500 dark:hover:bg-slate-700"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          paymentMethod === method
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'M-Pesa' && (
                  <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">M-Pesa payment option</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMpesaPaymentMode('full')}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          mpesaPaymentMode === 'full'
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-200 bg-white text-emerald-700 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300'
                        }`}
                      >
                        Full amount
                      </button>
                      <button
                        type="button"
                        onClick={() => setMpesaPaymentMode('half')}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          mpesaPaymentMode === 'half'
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-200 bg-white text-emerald-700 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300'
                        }`}
                      >
                        Half amount
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-emerald-800 dark:text-emerald-200">
                      {mpesaPaymentMode === 'full'
                        ? `Pay now: ${formatMoney(subtotal)}`
                        : `Pay now: ${formatMoney(mpesaDueNow)} • Balance on delivery: ${formatMoney(balanceDueOnDelivery)}`}
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{paymentMethod === 'M-Pesa' ? 'Total due' : 'Subtotal'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {paymentMethod === 'M-Pesa' ? formatMoney(mpesaDueNow) : formatMoney(subtotal)}
                  </span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-300"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5"
                >
                  {paymentMethod === 'M-Pesa' ? `Pay ${mpesaPaymentMode === 'full' ? 'full amount' : 'half amount'} via M-Pesa` : 'Confirm Cash on Delivery'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
