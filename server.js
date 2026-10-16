// Kuvaa Menswear: store server (products, orders, admin, M-Pesa prompt, WhatsApp alerts)
// Node 18+.  npm install && npm start
require("dotenv").config();
const express = require("express"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const E = process.env;
const PORT = E.PORT || 3000;
const ADMIN_PASSWORD = E.ADMIN_PASSWORD || "change-me-now";
const SELLER = E.SELLER_NUMBER || "254791648289";
const DATA = path.join(__dirname, "data"), DB = path.join(DATA, "db.json");
const UP = path.join(__dirname, "public", "uploads");
fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(UP, { recursive: true });

// ---------- database (JSON file) ----------
const SEED = [
 ["Oxford button-down","Shirts",2200,"#2f4a7a","shirt","S,M,L,XL,XXL","Cotton, long sleeve"],
 ["Linen short-sleeve shirt","Shirts",1800,"#9fb0a0","shirt","S,M,L,XL","Light and breathable"],
 ["Slim stripe shirt","Shirts",2000,"#d9dde6","shirt","S,M,L,XL","Office ready","New"],
 ["Heavy crew tee","Tees",900,"#e3a62b","tee","S,M,L,XL,XXL","240gsm cotton"],
 ["Plain black tee","Tees",800,"#1a1f2e","tee","S,M,L,XL,XXL","Daily basic"],
 ["Polo, navy","Tees",1500,"#22345c","tee","S,M,L,XL","Pique cotton","Best seller"],
 ["Chino trousers","Trousers",2800,"#b49a73","trousers","30,32,34,36,38","Stretch twill"],
 ["Formal trousers, charcoal","Trousers",3200,"#3b4050","trousers","30,32,34,36,38","Pressed crease"],
 ["Straight jeans","Trousers",3000,"#35527f","trousers","30,32,34,36","Mid-wash denim"],
 ["Bomber jacket","Jackets",4800,"#6b7a5a","jacket","M,L,XL,XXL","Water resistant"],
 ["Denim jacket","Jackets",4200,"#4b6794","jacket","S,M,L,XL","Classic fit"],
 ["Blazer, black","Jackets",6500,"#171a24","jacket","M,L,XL","Half-lined","New"],
].map((a, i) => ({ id: i + 1, n: a[0], c: a[1], p: a[2], col: a[3], s: a[4], sz: a[5], t: a[6], tag: a[7] || "", img: "", stock: 20, old: 0 }));
[[5, 1000], [6, 1900], [7, 3400], [10, 5800]].forEach(([i, o]) => { SEED[i - 1].old = o; }); // sample "was" prices, edit in /admin
let db;
try { db = JSON.parse(fs.readFileSync(DB, "utf8")); } catch { db = { products: SEED, orders: [] }; }
const save = () => fs.writeFileSync(DB, JSON.stringify(db, null, 1));
save();

// ---------- helpers ----------
const norm = p => { p = String(p || "").replace(/\D/g, ""); if (/^0[17]\d{8}$/.test(p)) p = "254" + p.slice(1); return /^254[17]\d{8}$/.test(p) ? p : null; };
const kes = n => "KES " + Number(n).toLocaleString("en-KE");
const restore = o => o.lines.forEach(l => { const p = db.products.find(x => x.id === l.id); if (p) p.stock += l.qty; });
const STATUSES = ["awaiting payment", "payment to verify", "paid", "dispatched", "delivered", "cancelled", "failed"];

// ---------- WhatsApp alert to the seller (optional) ----------
async function sendWA(to, body) {
  if (!E.WHATSAPP_TOKEN || !E.PHONE_NUMBER_ID) return console.log("[WhatsApp not configured]\n" + body);
  const r = await fetch(`https://graph.facebook.com/v20.0/${E.PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: "Bearer " + E.WHATSAPP_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  if (!r.ok) throw new Error((await r.json())?.error?.message || "WhatsApp error");
}
function notify(o) {
  const txt = `New order #${o.id}\n${o.name}, ${o.phone}\nDeliver to: ${o.place}\n\n` +
    o.lines.map(l => `- ${l.name}, size ${l.size} x${l.qty}`).join("\n") +
    `\n\nTotal: ${kes(o.total)}\nM-Pesa: ${o.mpesaCode || "pending"} (${o.status})`;
  sendWA(SELLER, txt).catch(e => console.error("WhatsApp:", e.message));
}

// ---------- M-Pesa STK push (Daraja), optional ----------
const stkOn = !!(E.MPESA_KEY && E.MPESA_SECRET && E.MPESA_SHORTCODE && E.MPESA_PASSKEY && E.MPESA_CALLBACK_URL);
const MB = E.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
async function stkPush(o) {
  const t = await (await fetch(MB + "/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + Buffer.from(E.MPESA_KEY + ":" + E.MPESA_SECRET).toString("base64") } })).json();
  const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const r = await (await fetch(MB + "/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: { Authorization: "Bearer " + t.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: E.MPESA_SHORTCODE,
      Password: Buffer.from(E.MPESA_SHORTCODE + E.MPESA_PASSKEY + ts).toString("base64"),
      Timestamp: ts, TransactionType: E.MPESA_TYPE || "CustomerPayBillOnline",
      Amount: o.total, PartyA: o.phone, PartyB: E.MPESA_TILL || E.MPESA_SHORTCODE, PhoneNumber: o.phone,
      CallBackURL: E.MPESA_CALLBACK_URL, AccountReference: "Kuvaa" + o.id, TransactionDesc: "Order " + o.id }) })).json();
  if (r.ResponseCode !== "0") throw new Error(r.errorMessage || r.ResponseDescription || "Prompt failed");
  o.checkoutId = r.CheckoutRequestID;
}

// ---------- app ----------
const app = express();
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(UP));
const DIST = path.join(__dirname, "client", "dist");
app.use(express.static(DIST));
app.get("/admin", (q, r) => r.sendFile(path.join(DIST, "index.html")));

app.get("/api/config", (q, r) => r.json({ stk: stkOn }));
app.get("/api/products", (q, r) => r.json(db.products));

app.post("/api/order", async (req, res) => {
  try {
    const { name, place, items, method, mpesaCode } = req.body || {};
    const phone = norm(req.body && req.body.phone);
    if (!String(name || "").trim() || !String(place || "").trim()) return res.status(400).json({ error: "Enter your name and delivery location" });
    if (!phone) return res.status(400).json({ error: "Enter a valid Safaricom number, e.g. 0712345678" });
    if (!Array.isArray(items) || !items.length || items.length > 30) return res.status(400).json({ error: "Your cart is empty" });
    const lines = []; let total = 0;
    for (const i of items) {
      const p = db.products.find(x => x.id === +i.id), q = Math.floor(+i.qty);
      if (!p || !(q >= 1 && q <= 20) || !p.sz.split(",").includes(i.size)) return res.status(400).json({ error: "Invalid item in cart" });
      if (p.stock < q) return res.status(400).json({ error: `${p.n} is out of stock (${p.stock} left)` });
      lines.push({ id: p.id, name: p.n, size: i.size, qty: q, price: p.p }); total += p.p * q;
    }
    const code = String(mpesaCode || "").toUpperCase();
    if (method === "stk") { if (!stkOn) return res.status(501).json({ error: "Phone prompt is not available. Pay manually." }); }
    else {
      if (!/^[A-Z0-9]{10}$/.test(code)) return res.status(400).json({ error: "Enter the 10-character M-Pesa code" });
      if (db.orders.some(o => o.mpesaCode === code)) return res.status(400).json({ error: "That M-Pesa code was already used" });
    }
    const order = { id: crypto.randomBytes(3).toString("hex").toUpperCase(), created: new Date().toISOString(),
      name: String(name).trim().slice(0, 80), phone, place: String(place).trim().slice(0, 200), lines, total,
      method: method === "stk" ? "stk" : "manual", mpesaCode: code || null,
      status: method === "stk" ? "awaiting payment" : "payment to verify" };
    lines.forEach(l => { db.products.find(p => p.id === l.id).stock -= l.qty; });
    db.orders.unshift(order);
    if (order.method === "stk") {
      try { await stkPush(order); }
      catch (e) { restore(order); order.status = "failed"; save(); return res.status(502).json({ error: "Could not send the M-Pesa prompt: " + e.message }); }
    } else notify(order);
    save();
    res.json({ id: order.id, status: order.status });
  } catch (e) { console.error(e); res.status(500).json({ error: "Something went wrong. Try again." }); }
});
app.get("/api/order/:id", (q, r) => { const o = db.orders.find(x => x.id === q.params.id); o ? r.json({ status: o.status, mpesaCode: o.mpesaCode }) : r.status(404).json({ error: "Not found" }); });

app.post("/api/mpesa/callback", (req, res) => {
  const cb = req.body && req.body.Body && req.body.Body.stkCallback;
  const o = cb && db.orders.find(x => x.checkoutId === cb.CheckoutRequestID);
  if (o && o.status === "awaiting payment") {
    if (cb.ResultCode === 0) {
      const it = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
      const rec = it.find(i => i.Name === "MpesaReceiptNumber");
      o.mpesaCode = rec && rec.Value; o.status = "paid"; notify(o);
    } else { o.status = "failed"; restore(o); }
    save();
  }
  res.json({ ResultCode: 0, ResultDesc: "OK" });
});

// ---------- admin ----------
const tokens = new Set();
const h = s => crypto.createHash("sha256").update(String(s)).digest();
app.post("/api/admin/login", (req, res) => {
  if (!crypto.timingSafeEqual(h(req.body && req.body.password), h(ADMIN_PASSWORD))) return res.status(401).json({ error: "Wrong password" });
  const t = crypto.randomBytes(24).toString("hex"); tokens.add(t); res.json({ token: t });
});
const auth = (req, res, next) => tokens.has((req.headers.authorization || "").slice(7)) ? next() : res.status(401).json({ error: "Login required" });

app.get("/api/admin/orders", auth, (q, r) => r.json(db.orders));
app.put("/api/admin/orders/:id", auth, (req, res) => {
  const o = db.orders.find(x => x.id === req.params.id), s = req.body && req.body.status;
  if (!o || !STATUSES.includes(s)) return res.status(400).json({ error: "Invalid" });
  const dead = x => x === "cancelled" || x === "failed";
  if (dead(s) && !dead(o.status)) restore(o);
  if (!dead(s) && dead(o.status)) o.lines.forEach(l => { const p = db.products.find(x => x.id === l.id); if (p) p.stock -= l.qty; });
  o.status = s; save(); res.json(o);
});
app.post("/api/admin/products", auth, (req, res) => {
  const b = req.body || {}, price = Math.round(+b.p), stock = Math.round(+b.stock);
  const sz = String(b.sz || "").split(",").map(x => x.trim()).filter(Boolean).join(",");
  if (!String(b.n || "").trim() || !(price > 0) || !(stock >= 0) || !sz) return res.status(400).json({ error: "Name, price, stock and sizes are required" });
  const prod = { old: +b.old > price ? Math.round(+b.old) : 0, n: String(b.n).trim().slice(0, 80), c: String(b.c || "Other").trim().slice(0, 30), p: price, stock, sz,
    col: /^#[0-9a-f]{6}$/i.test(b.col) ? b.col : "#2f4a7a", s: ["tee", "shirt", "trousers", "jacket"].includes(b.s) ? b.s : "tee",
    t: String(b.t || "").slice(0, 80), tag: String(b.tag || "").slice(0, 20), img: /^\/uploads\/[\w.-]+$/.test(b.img || "") ? b.img : "" };
  const old = db.products.find(x => x.id === +b.id);
  if (old) Object.assign(old, prod); else db.products.push({ id: Math.max(0, ...db.products.map(x => x.id)) + 1, ...prod });
  save(); res.json(db.products);
});
app.delete("/api/admin/products/:id", auth, (req, res) => { db.products = db.products.filter(x => x.id !== +req.params.id); save(); res.json(db.products); });
app.post("/api/admin/upload", auth, (req, res) => {
  const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec((req.body && req.body.dataUrl) || "");
  if (!m) return res.status(400).json({ error: "Use a PNG, JPG or WebP image" });
  const f = crypto.randomBytes(8).toString("hex") + "." + (m[1] === "jpeg" ? "jpg" : m[1]);
  fs.writeFileSync(path.join(UP, f), Buffer.from(m[2], "base64")); res.json({ url: "/uploads/" + f });
});

// React pages (/, /shop): serve the app for any other URL
app.get("*", (q, r) => q.path.startsWith("/api") ? r.status(404).json({ error: "Not found" }) : r.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => console.log(`Store: http://localhost:${PORT}   Admin: http://localhost:${PORT}/admin` + (E.ADMIN_PASSWORD ? "" : "   (set ADMIN_PASSWORD!)")));
