import { useState } from 'react'
import './App.css'

const products = [
  { name: 'Classic White Shirt', price: 'KSh 1,800' },
  { name: 'Casual Denim', price: 'KSh 2,400' },
  { name: 'Premium Hoodie', price: 'KSh 2,900' },
]

const defaultForm = {
  name: '',
  product: products[0].name,
  quantity: 1,
  location: '',
}

function App() {
  const [form, setForm] = useState(defaultForm)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const { name, product, quantity, location } = form

    if (!name.trim() || !location.trim() || quantity < 1) {
      alert('Please fill in all required details before sending your order.')
      return
    }

    const whatsappNumber = '254791648289'
    const message = `Hello SHA Fashion, I would like to order.%0A%0A- Name: ${encodeURIComponent(name.trim())}%0A- Product: ${encodeURIComponent(product)}%0A- Quantity: ${encodeURIComponent(quantity)}%0A- Location: ${encodeURIComponent(location.trim())}%0A%0APlease confirm the total and M-Pesa payment instructions.`

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <header className="topbar">
        <div className="container nav">
          <div className="brand">
            <span className="brand-mark">SHA</span>
            <span>Fashion</span>
          </div>

          <nav className="nav-links" aria-label="Main navigation">
            <a href="#shop">Shop</a>
            <a href="#about">About</a>
            <a href="#payment">Payment</a>
            <a href="#contact">Contact</a>
          </nav>

          <a
            className="btn btn-primary"
            href="https://wa.me/254791648289?text=Hello%20SHA%20Fashion%2C%20I%20want%20to%20place%20an%20order."
            target="_blank"
            rel="noreferrer"
          >
            Order on WhatsApp
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Modern Style. Everyday Confidence.</p>
              <h1>Premium men's clothing for a sharp look.</h1>
              <p className="lead">
                Shop sleek outfits, casual wear, premium shirts, and stylish layers.
                Place your order in minutes and pay securely via M-Pesa.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#shop">Shop Now</a>
                <a
                  className="btn btn-secondary"
                  href="https://wa.me/254791648289?text=Hello%20SHA%20Fashion%2C%20I%20need%20help%20choosing%20an%20outfit."
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat with Seller
                </a>
              </div>

              <ul className="trust-list">
                <li>Fast delivery</li>
                <li>Quality fabrics</li>
                <li>Easy M-Pesa payment</li>
              </ul>
            </div>

            <div className="hero-card">
              <div className="product-badge">Best Seller</div>
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
                alt="Male model wearing premium fashion"
              />
              <div className="hero-card-info">
                <div>
                  <p>Signature Collection</p>
                  <h3>Urban Smart Set</h3>
                </div>
                <span>KSh 3,200</span>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="products">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Our Collection</p>
              <h2>Popular picks</h2>
            </div>

            <div className="product-grid">
              <article className="product-card">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                  alt="Classic white shirt"
                />
                <div className="product-info">
                  <div>
                    <h3>Classic White Shirt</h3>
                    <p>Clean, smart and versatile.</p>
                  </div>
                  <span>KSh 1,800</span>
                </div>
              </article>

              <article className="product-card">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
                  alt="Casual denim outfit"
                />
                <div className="product-info">
                  <div>
                    <h3>Casual Denim</h3>
                    <p>Comfortable everyday fit.</p>
                  </div>
                  <span>KSh 2,400</span>
                </div>
              </article>

              <article className="product-card">
                <img
                  src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80"
                  alt="Premium hoodie"
                />
                <div className="product-info">
                  <div>
                    <h3>Premium Hoodie</h3>
                    <p>Modern streetwear essentials.</p>
                  </div>
                  <span>KSh 2,900</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="about" className="order-section">
          <div className="container order-grid">
            <div className="order-copy">
              <p className="eyebrow">How to Order</p>
              <h2>Place your order in a few steps</h2>
              <ol>
                <li>Select your desired product.</li>
                <li>Fill in your details below.</li>
                <li>Send the message on WhatsApp and confirm payment via M-Pesa.</li>
              </ol>
            </div>

            <form className="order-form" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Product
                <select name="product" value={form.product} onChange={handleChange} required>
                  {products.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} - {item.price}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Location / Delivery Area
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Nairobi"
                  required
                />
              </label>

              <button type="submit" className="btn btn-primary full-width">
                Send Order via WhatsApp
              </button>
            </form>
          </div>
        </section>

        <section id="payment" className="payment-section">
          <div className="container payment-box">
            <div>
              <p className="eyebrow">Payment</p>
              <h2>Pay safely with M-Pesa</h2>
            </div>

            <div className="payment-details">
              <p>
                <strong>Seller Number:</strong> +254 791 648289
              </p>
              <p>
                <strong>Method:</strong> Send the exact amount via M-Pesa to the seller
                number.
              </p>
              <p>
                <strong>After payment:</strong> Send the confirmation message on WhatsApp.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="container footer-content">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark">SHA</span>
              <span>Fashion</span>
            </div>
            <p>Premium men's apparel for smart, confident living.</p>
          </div>

          <div className="footer-contact">
            <p>WhatsApp</p>
            <a href="https://wa.me/254791648289" target="_blank" rel="noreferrer">
              +254 791 648289
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
