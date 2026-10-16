import { useEffect, useState } from "react";
import Cart from "./Cart.jsx";
import Admin from "./Admin.jsx";
import Home from "./Home.jsx";
import Shop from "./Shop.jsx";
import { RouterProvider, Link, useRoute } from "./Router.jsx";
import { req } from "./api.js";

const loadCart = () => { try { return JSON.parse(localStorage.getItem("kuvaa-cart") || "[]"); } catch { return []; } };

export default function App() {
  return location.pathname.startsWith("/admin") ? <Admin /> : <RouterProvider><Store /></RouterProvider>;
}

function Store() {
  const { path, search, go } = useRoute();
  const [q, setQ] = useState("");
  useEffect(() => setQ(new URLSearchParams(search).get("q") || ""), [search]);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState("loading");
  const [stk, setStk] = useState(false);
  const [cart, setCart] = useState(loadCart);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    req("/api/products").then(p => { setProducts(p); setCart(c => c.filter(i => p.some(x => x.id === i.id))); setState("ready"); }).catch(() => setState("error"));
    req("/api/config").then(c => setStk(c.stk)).catch(() => {});
  }, []);
  useEffect(() => { try { localStorage.setItem("kuvaa-cart", JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2200); return () => clearTimeout(t); }, [toast]);

  const count = cart.reduce((a, i) => a + i.q, 0);
  const add = (p, size) => {
    setCart(c => { const f = c.find(i => i.id === p.id && i.size === size); return f ? c.map(i => i === f ? { ...i, q: i.q + 1 } : i) : [...c, { id: p.id, size, q: 1 }]; });
    setToast("Added to cart");
  };
  const page = { products, state, onAdd: add, notify: setToast };
  const shop = path.startsWith("/shop");

  return (
    <>
      <header>
        <div className="wrap">
          <Link className="logo" to="/">KUVAA</Link>
          <form className="sbar" role="search" onSubmit={e => { e.preventDefault(); go(q.trim() ? "/shop?q=" + encodeURIComponent(q.trim()) : "/shop"); }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search shirts, jeans, jackets..." aria-label="Search products" />
            <button type="submit">Search</button>
          </form>
          <button className="cartbtn" onClick={() => setOpen(true)} aria-label="Open cart">Cart ({count})</button>
        </div>
        <div className="subnav"><div className="wrap">
          <nav aria-label="Main">
            <Link to="/" aria-current={path === "/" ? "page" : undefined}>Home</Link>
            <Link to="/shop" aria-current={shop ? "page" : undefined}>Shop</Link>
            <Link to="/shop#fit">Size guide</Link>
            <Link to="/#contact">Contact</Link>
          </nav>
        </div></div>
      </header>

      <main id="top">{shop ? <Shop {...page} /> : <Home {...page} />}</main>

      <footer><div className="wrap"><span>© 2026 Kuvaa Menswear</span><span>Prices in Kenyan shillings (KES)</span></div></footer>

      <Cart open={open} onClose={() => setOpen(false)} cart={cart} setCart={setCart} products={products} stk={stk} notify={setToast} />
      <div className={"toast" + (toast ? " on" : "")} role="status">{toast}</div>
    </>
  );
}
