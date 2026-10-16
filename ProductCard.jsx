import { useState } from "react";
import Garment from "./Garment.jsx";
import { fmt } from "./api.js";

export const discount = p => (p.old > p.p ? Math.round((1 - p.p / p.old) * 100) : 0);

export default function ProductCard({ p, onAdd }) {
  const sizes = p.sz.split(",");
  const [size, setSize] = useState(sizes[0]);
  const out = p.stock <= 0, off = discount(p);
  return (
    <article className="card">
      <div className="pic" style={{ background: `color-mix(in srgb, ${p.col} 16%, var(--surface))` }}>
        {(out || p.tag) && <span className="tag">{out ? "Sold out" : p.tag}</span>}
        {!out && off > 0 && <span className="disc">-{off}%</span>}
        {p.img ? <img src={p.img} alt={p.n} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Garment shape={p.s} color={p.col} label={p.n} />}
      </div>
      <div className="info">
        <h3>{p.n}</h3>
        <span className="price">{fmt(p.p)}{off > 0 && <span className="old">{fmt(p.old)}</span>}</span>
        {!out && p.stock <= 5 && <span className="few">Only {p.stock} left</span>}
        <div className="buy">
          <select aria-label={"Size for " + p.n} value={size} onChange={e => setSize(e.target.value)}>{sizes.map(s => <option key={s}>{s}</option>)}</select>
          <button className="btn" disabled={out} onClick={() => onAdd(p, size)}>{out ? "Sold out" : "Add to cart"}</button>
        </div>
      </div>
    </article>
  );
}
