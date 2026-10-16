import { useEffect, useState } from "react";
import { req, fmt } from "./api.js";

const STATUSES = ["awaiting payment", "payment to verify", "paid", "dispatched", "delivered", "cancelled", "failed"];
const EMPTY = { id: "", n: "", c: "", p: "", old: "", stock: 10, sz: "S,M,L,XL", t: "", tag: "", s: "tee", col: "#2f4a7a", img: "" };
const getTok = () => { try { return sessionStorage.getItem("kt") || ""; } catch { return ""; } };

export default function Admin() {
  const [token, setToken] = useState(getTok);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [prods, setProds] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(null);
  const [fmsg, setFmsg] = useState("");

  const api = (u, method, body) => req("/api/admin" + u, { method, body, token });
  const logout = () => { setToken(""); try { sessionStorage.removeItem("kt"); } catch { /* ignore */ } };
  const guard = e => { if (e.status === 401) logout(); else alert(e.message); };
  const loadOrders = () => api("/orders").then(setOrders).catch(guard);
  const loadProds = () => req("/api/products").then(setProds).catch(() => {});

  useEffect(() => { if (token) { loadOrders(); loadProds(); } }, [token]);

  async function login() {
    try {
      const d = await req("/api/admin/login", { method: "POST", body: { password: pw } });
      try { sessionStorage.setItem("kt", d.token); } catch { /* ignore */ }
      setToken(d.token); setPw(""); setErr("");
    } catch (e) { setErr(e.message); }
  }
  async function setStatus(id, status) { try { await api("/orders/" + id, "PUT", { status }); loadOrders(); } catch (e) { guard(e); } }
  async function save(e) {
    e.preventDefault();
    try { setProds(await api("/products", "POST", form)); setForm(null); } catch (x) { setFmsg(x.message); }
  }
  async function remove(id) { if (confirm("Delete this product?")) try { setProds(await api("/products/" + id, "DELETE")); } catch (e) { guard(e); } }
  function upload(e) {
    const file = e.target.files[0]; if (!file) return;
    const im = new Image();
    im.onload = async () => {
      const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      try { const d = await api("/upload", "POST", { dataUrl: c.toDataURL("image/jpeg", .82) }); setForm(f => ({ ...f, img: d.url })); }
      catch (x) { setFmsg(x.message); }
    };
    im.src = URL.createObjectURL(file);
  }
  const f = k => ({ value: form[k] ?? "", onChange: e => setForm({ ...form, [k]: e.target.value }) });

  if (!token) return (
    <div className="adm"><div className="c" style={{ maxWidth: 360, margin: "60px auto" }}>
      <h2>Kuvaa admin</h2><p className="m">Enter the admin password.</p>
      <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} autoComplete="current-password" />
      <p /><button className="p" onClick={login}>Log in</button><p className="m">{err}</p>
    </div></div>
  );

  const list = orders.filter(o => !filter || o.status === filter);
  return (
    <div className="adm">
      <div className="row" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28 }}>Kuvaa admin</h1>
        <div className="row">
          <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>Orders</button>
          <button className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>Products</button>
          <a href="/" target="_blank" rel="noreferrer">View shop</a>
          <button onClick={logout}>Log out</button>
        </div>
      </div>

      {tab === "orders" && <>
        <div className="row" style={{ marginBottom: 12 }}><h2>Orders</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        {list.length === 0 && <p className="m">No orders yet.</p>}
        {list.map(o => (
          <div className="c" key={o.id}>
            <div className="row"><b>#{o.id} · {o.name}</b><span className="m">{new Date(o.created).toLocaleString()}</span></div>
            <p>{o.lines.map((x, i) => <span key={i}>{x.name}, size {x.size} x{x.qty}<br /></span>)}</p>
            <p className="m">Phone {o.phone} · Deliver to {o.place}<br />M-Pesa code: {o.mpesaCode || "waiting"} ({o.method === "stk" ? "phone prompt" : "manual"})</p>
            <div className="row"><b>{fmt(o.total)}</b>
              <span className="row">
                <select value={o.status} onChange={e => setStatus(o.id, e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                <a href={`https://wa.me/${o.phone}?text=${encodeURIComponent(`Hello ${o.name}, about your Kuvaa order #${o.id}: `)}`} target="_blank" rel="noreferrer">WhatsApp customer</a>
              </span></div>
          </div>
        ))}
      </>}

      {tab === "products" && <>
        <div className="row" style={{ marginBottom: 12 }}><h2>Products</h2><button className="p" onClick={() => { setForm(EMPTY); setFmsg(""); }}>Add product</button></div>
        {form && (
          <form className="c" onSubmit={save}>
            <div className="g">
              <div><label>Name</label><input required {...f("n")} /></div>
              <div><label>Category</label><input required list="cats" {...f("c")} /><datalist id="cats"><option>Shirts</option><option>Tees</option><option>Trousers</option><option>Jackets</option><option>Shoes</option><option>Accessories</option></datalist></div>
              <div><label>Price (KES)</label><input type="number" min="1" required {...f("p")} /></div>
              <div><label>Old price (optional, shows a discount)</label><input type="number" min="0" {...f("old")} /></div>
              <div><label>Stock</label><input type="number" min="0" required {...f("stock")} /></div>
              <div><label>Sizes (comma separated)</label><input required placeholder="S,M,L,XL" {...f("sz")} /></div>
              <div><label>Short description</label><input {...f("t")} /></div>
              <div><label>Badge (New, Sale...)</label><input {...f("tag")} /></div>
              <div><label>Shape if no photo</label><select {...f("s")}><option>tee</option><option>shirt</option><option>trousers</option><option>jacket</option></select></div>
              <div><label>Colour if no photo</label><input type="color" {...f("col")} /></div>
              <div><label>Photo</label><input type="file" accept="image/*" onChange={upload} /></div>
            </div>
            {form.img && <p><img className="th" src={form.img} alt="" /></p>}
            <p><button className="p" type="submit">Save product</button> <button type="button" onClick={() => setForm(null)}>Cancel</button> <span className="m">{fmsg}</span></p>
          </form>
        )}
        {prods.map(p => (
          <div className="c row" key={p.id}>
            <span className="row" style={{ justifyContent: "flex-start" }}>
              {p.img ? <img className="th" src={p.img} alt="" /> : <span className="th" style={{ background: p.col }} />}
              <span><b>{p.n}</b><br /><span className="m">{p.c} · {fmt(p.p)} · {p.stock} in stock · sizes {p.sz}</span></span>
            </span>
            <span className="row"><button onClick={() => { setForm(p); setFmsg(""); }}>Edit</button><button onClick={() => remove(p.id)}>Delete</button></span>
          </div>
        ))}
      </>}
    </div>
  );
}
