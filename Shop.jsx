import { useEffect, useMemo, useState } from "react";
import ProductCard, { discount } from "./ProductCard.jsx";
import Contact from "./Contact.jsx";
import { Link, useRoute } from "./Router.jsx";

const SORTS = [["pop", "Popularity"], ["new", "Newest"], ["lo", "Price: low to high"], ["hi", "Price: high to low"], ["off", "Biggest discount"]];
const CMP = {
  pop: (a, b) => (b.stock > 0) - (a.stock > 0) || (!!b.tag - !!a.tag),
  new: (a, b) => b.id - a.id, lo: (a, b) => a.p - b.p, hi: (a, b) => b.p - a.p, off: (a, b) => discount(b) - discount(a),
};

export default function Shop({ products, state, onAdd, notify }) {
  const { search } = useRoute();
  const sp = new URLSearchParams(search), cat = sp.get("cat") || "All", q = (sp.get("q") || "").trim().toLowerCase();
  const [sort, setSort] = useState("pop");
  const [min, setMin] = useState(""), [max, setMax] = useState("");
  const [sizes, setSizes] = useState([]), [stockOnly, setStockOnly] = useState(false);
  const [show, setShow] = useState(false), [limit, setLimit] = useState(12);
  useEffect(() => { document.title = "Shop | Kuvaa Menswear"; }, []);
  useEffect(() => setLimit(12), [search, sort, min, max, sizes, stockOnly]);

  const cats = useMemo(() => [...new Set(products.map(p => p.c))], [products]);
  const allSizes = useMemo(() => [...new Set(products.flatMap(p => p.sz.split(",")))], [products]);
  const filtersOn = !!(min || max || sizes.length || stockOnly);
  const list = useMemo(() => products
    .filter(p => (cat === "All" || p.c === cat) && (!q || (p.n + " " + p.t + " " + p.c).toLowerCase().includes(q))
      && (!min || p.p >= +min) && (!max || p.p <= +max) && (!sizes.length || sizes.some(s => p.sz.split(",").includes(s))) && (!stockOnly || p.stock > 0))
    .sort(CMP[sort]), [products, cat, q, min, max, sizes, stockOnly, sort]);
  const deals = products.filter(p => discount(p) > 0 && p.stock > 0);
  const clear = () => { setMin(""); setMax(""); setSizes([]); setStockOnly(false); };
  const toggle = s => setSizes(x => x.includes(s) ? x.filter(y => y !== s) : [...x, s]);

  return (
    <>
      <section id="shop" style={{ padding: "24px 0 48px" }}><div className="wrap">
        {deals.length > 0 && cat === "All" && !q && !filtersOn && (
          <div className="deals">
            <div className="dh"><span>Deals</span><span>Up to -{Math.max(...deals.map(discount))}% off</span></div>
            <div className="dr">{deals.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} />)}</div>
          </div>
        )}

        <div className="shopwrap">
          <aside className={"side" + (show ? " open" : "")} aria-label="Filters" style={{ position: undefined }}>
            <h4>Category</h4>
            <div className="cl">
              <Link to="/shop" aria-current={cat === "All" ? "true" : undefined}><span>All products</span><small>{products.length}</small></Link>
              {cats.map(c => <Link key={c} to={"/shop?cat=" + encodeURIComponent(c)} aria-current={cat === c ? "true" : undefined}><span>{c}</span><small>{products.filter(p => p.c === c).length}</small></Link>)}
            </div>
            <h4>Price (KES)</h4>
            <div className="pr">
              <input type="number" min="0" placeholder="Min" aria-label="Minimum price" value={min} onChange={e => setMin(e.target.value)} />
              <input type="number" min="0" placeholder="Max" aria-label="Maximum price" value={max} onChange={e => setMax(e.target.value)} />
            </div>
            <h4>Size</h4>
            <div className="szs">{allSizes.map(s => <button key={s} className="chip" aria-pressed={sizes.includes(s)} onClick={() => toggle(s)}>{s}</button>)}</div>
            <h4>Availability</h4>
            <label className="chk"><input type="checkbox" checked={stockOnly} onChange={e => setStockOnly(e.target.checked)} /> In stock only</label>
            {filtersOn && <p><button className="chip" onClick={clear}>Clear filters</button></p>}
            <p style={{ height: 6 }} />
          </aside>

          <div>
            <div className="resbar">
              <span><b>{list.length}</b> {list.length === 1 ? "product" : "products"} {cat !== "All" && <>in <b>{cat}</b></>}{q && <> for “{sp.get("q")}”</>}</span>
              <span className="row" style={{ gap: 10 }}>
                <button className="chip fbtn" onClick={() => setShow(s => !s)}>{show ? "Hide filters" : "Filters"}</button>
                <label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              </span>
            </div>
            {state === "loading" && <p className="empty">Loading the range...</p>}
            {state === "error" && <p className="empty">Could not load products. Refresh the page to try again.</p>}
            {state === "ready" && list.length === 0 && <p className="empty">No products match. Try clearing the filters.</p>}
            <div className="pgrid">{list.slice(0, limit).map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} />)}</div>
            {list.length > limit && <p style={{ textAlign: "center", marginTop: 20 }}><button className="btn" onClick={() => setLimit(l => l + 12)}>Load more</button></p>}
          </div>
        </div>
      </div></section>

      <section className="about" id="fit"><div className="wrap">
        <div><h2>Fit that<br />holds up.</h2>
          <p style={{ marginTop: 20 }}>Every piece is checked by hand before it leaves the shop. If you are between sizes, go up for shirts and jackets, and stay true for trousers. Not sure? Send us your height and weight and we will pick for you.</p></div>
        <div>
          <h3 style={{ fontSize: 22 }}>Shirt and tee sizes (chest, cm)</h3>
          <div className="sizes">{[["S", "92–97"], ["M", "98–103"], ["L", "104–109"], ["XL", "110–115"], ["XXL", "116–121"]].map(([a, b]) => <div key={a}><b>{a}</b>{b}</div>)}</div>
          <h3 style={{ fontSize: 22, marginTop: 26 }}>Trouser sizes (waist, cm)</h3>
          <div className="sizes">{[["30", "76"], ["32", "81"], ["34", "86"], ["36", "91"], ["38", "96"]].map(([a, b]) => <div key={a}><b>{a}</b>{b}</div>)}</div>
        </div>
      </div></section>

      <Contact notify={notify} />
    </>
  );
}
