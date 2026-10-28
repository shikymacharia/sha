const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");
const v1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Secrets (firebase functions:secrets:set NAME)
const SMTP_URL = defineSecret("SMTP_URL");            // smtps://user:app-password@smtp.gmail.com
const MPESA_KEY = defineSecret("MPESA_KEY");          // Daraja consumer key
const MPESA_SECRET = defineSecret("MPESA_SECRET");    // Daraja consumer secret
const MPESA_PASSKEY = defineSecret("MPESA_PASSKEY");
const MPESA_CB_TOKEN = defineSecret("MPESA_CB_TOKEN"); // any long random string; protects the callback URL
// Plain params (functions/.env.<project>)
const SELLER_EMAIL = defineString("SELLER_EMAIL");
const MAIL_FROM = defineString("MAIL_FROM", { default: "HADAR Menswear <no-reply@hadar.example>" });
const MPESA_SHORTCODE = defineString("MPESA_SHORTCODE", { default: "" }); // leave empty to disable the phone prompt
const MPESA_TILL = defineString("MPESA_TILL", { default: "" });           // Buy Goods till number, if different
const MPESA_TYPE = defineString("MPESA_TYPE", { default: "CustomerPayBillOnline" }); // or CustomerBuyGoodsOnline
const MPESA_ENV = defineString("MPESA_ENV", { default: "sandbox" });      // sandbox | production
const MPESA_CALLBACK_URL = defineString("MPESA_CALLBACK_URL", { default: "" }); // the mpesaCallback function URL

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kes = (n) => "KSh " + Math.round(n).toLocaleString("en-KE");
const send = (to, subject, html) =>
  nodemailer.createTransport(SMTP_URL.value()).sendMail({ from: MAIL_FROM.value(), to, subject, html });
const normPhone = (p) => { p = String(p || "").replace(/\D/g, ""); if (/^0[17]\d{8}$/.test(p)) p = "254" + p.slice(1); return /^254[17]\d{8}$/.test(p) ? p : null; };

// ---------- M-Pesa STK push (Daraja) ----------
const base = () => (MPESA_ENV.value() === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");
async function stkPush(o) {
  const t = await (await fetch(base() + "/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + Buffer.from(MPESA_KEY.value() + ":" + MPESA_SECRET.value()).toString("base64") } })).json();
  if (!t.access_token) throw new Error("M-Pesa login failed");
  const sc = MPESA_SHORTCODE.value(), ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const r = await (await fetch(base() + "/mpesa/stkpush/v1/processrequest", {
    method: "POST", headers: { Authorization: "Bearer " + t.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: sc, Password: Buffer.from(sc + MPESA_PASSKEY.value() + ts).toString("base64"), Timestamp: ts,
      TransactionType: MPESA_TYPE.value(), Amount: Math.ceil(o.dueNow), PartyA: o.phone, PartyB: MPESA_TILL.value() || sc, PhoneNumber: o.phone,
      CallBackURL: MPESA_CALLBACK_URL.value() + "?t=" + MPESA_CB_TOKEN.value(), AccountReference: "HADAR" + o.id, TransactionDesc: "Order " + o.id }) })).json();
  if (r.ResponseCode !== "0") throw new Error(r.errorMessage || r.ResponseDescription || "Prompt failed");
  return r.CheckoutRequestID;
}

// Clients can't write orders. They call this; prices and stock are read and updated server-side in one transaction.
// Products with a numeric `qty` are stock-tracked; products without one are treated as unlimited.
// Works for guests too (no account needed). Guests get an unguessable `token` to follow their order's status.
const same = (a, b) => { a = Buffer.from(String(a || "")); b = Buffer.from(String(b || "")); return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b); };
exports.placeOrder = onCall({ secrets: [MPESA_KEY, MPESA_SECRET, MPESA_PASSKEY, MPESA_CB_TOKEN] }, async ({ auth, data, rawRequest }) => {
  const { items, place, method, mode } = data || {};
  const phone = normPhone(data && data.phone);
  if (!phone) throw new HttpsError("invalid-argument", "Enter a valid Kenyan phone number, e.g. 0712345678.");
  if (!String(place || "").trim()) throw new HttpsError("invalid-argument", "Enter a delivery location.");
  const name = String((data && data.name) || (auth && auth.token.name) || "").trim().slice(0, 80);
  if (name.length < 2) throw new HttpsError("invalid-argument", "Enter your name.");
  const email = String((data && data.email) || (auth && auth.token.email) || "").trim().toLowerCase().slice(0, 120) || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError("invalid-argument", "That email address doesn't look right.");

  // Anti-abuse (guests can order, so limit how often one phone / connection can): no second prompt while one is waiting, and hourly caps.
  const ipHash = crypto.createHash("sha256").update(String((rawRequest && rawRequest.ip) || "")).digest("hex").slice(0, 16);
  const hourAgo = Date.now() - 3600e3;
  const recent = async (field, value) => (await db.collection("orders").where(field, "==", value).get()).docs.map((d) => d.data())
    .filter((o) => (o.created ? o.created.toMillis() : Date.now()) > hourAgo);
  const byPhone = await recent("phone", phone);
  if (byPhone.some((o) => o.status === "awaiting payment")) throw new HttpsError("resource-exhausted", "A payment prompt is already waiting for that phone. Finish it, or try again in a few minutes.");
  if (byPhone.length >= 4 || (await recent("ipHash", ipHash)).length >= 8) throw new HttpsError("resource-exhausted", "Too many orders from this phone or connection. Please try again later, or message us on WhatsApp.");
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new HttpsError("invalid-argument", "Your cart is empty.");

  const want = items.map((i) => ({ id: String(i.id), size: String(i.size).slice(0, 6), qty: Math.floor(+i.qty) }));
  if (want.some((i) => !i.id || i.id.includes("/") || !(i.qty >= 1 && i.qty <= 20))) throw new HttpsError("invalid-argument", "Invalid item in your cart.");
  const need = {}; want.forEach((i) => { need[i.id] = (need[i.id] || 0) + i.qty; });

  const mpesa = method === "M-Pesa", stk = mpesa && !!MPESA_SHORTCODE.value() && !!MPESA_CALLBACK_URL.value();
  const id = crypto.randomBytes(3).toString("hex").toUpperCase();
  const ref = db.doc(`orders/${id}`);
  const order = await db.runTransaction(async (tx) => {
    const snaps = await tx.getAll(...Object.keys(need).map((pid) => db.doc(`products/${pid}`)));
    const prod = {}; snaps.forEach((p) => { if (p.exists) prod[p.id] = p; });
    const lines = []; let total = 0;
    for (const i of want) {
      const p = prod[i.id]; if (!p) throw new HttpsError("invalid-argument", "An item in your cart is no longer available.");
      lines.push({ id: i.id, name: p.data().name, size: i.size, qty: i.qty, price: p.data().price }); total += p.data().price * i.qty;
    }
    for (const pid of Object.keys(need)) {
      const d = prod[pid].data();
      if (typeof d.qty === "number" && d.qty < need[pid]) throw new HttpsError("failed-precondition", d.qty > 0 ? `Only ${d.qty} left of ${d.name}.` : `${d.name} is sold out.`);
    }
    for (const pid of Object.keys(need)) { const d = prod[pid].data(); if (typeof d.qty === "number") tx.update(prod[pid].ref, { qty: d.qty - need[pid] }); }
    const o = {
      id, uid: auth ? auth.uid : null, guest: !auth, token: crypto.randomBytes(8).toString("hex"), ipHash, email, name,
      phone, place: String(place).trim().slice(0, 200), lines, total, method: mpesa ? "M-Pesa" : "Cash on Delivery",
      dueNow: mpesa && mode === "half" ? total / 2 : total, status: stk ? "awaiting payment" : "new", stockHeld: true,
      created: admin.firestore.FieldValue.serverTimestamp(),
    };
    tx.set(ref, o);
    return o;
  });
  if (stk) {
    try { await ref.update({ checkoutId: await stkPush(order) }); }
    catch (e) { console.error("STK", e.message); await ref.update({ status: "failed", note: e.message }); throw new HttpsError("unavailable", "Could not send the M-Pesa prompt. Check your number and try again."); }
  }
  return { id, stk, token: order.token };
});

// Lets a guest (or anyone holding the order token) follow payment status without an account.
exports.orderStatus = onCall(async ({ data }) => {
  const id = String((data && data.id) || "");
  const o = /^[A-F0-9]{6}$/.test(id) ? (await db.doc(`orders/${id}`).get()).data() : null;
  if (!o || !same(o.token, data.token)) throw new HttpsError("not-found", "Order not found.");
  return { status: o.status, mpesaCode: o.mpesaCode || null, note: o.note || null, phone: o.phone };
});

// ---------- stock bookkeeping ----------
// Cancelled/failed orders give their stock back; reviving one takes it again. `stockHeld` makes this safe to retry.
async function setStock(orderId, hold) {
  await db.runTransaction(async (tx) => {
    const oref = db.doc(`orders/${orderId}`), o = (await tx.get(oref)).data();
    if (!o || o.stockHeld === hold) return;
    const need = {}; o.lines.forEach((l) => { need[l.id] = (need[l.id] || 0) + l.qty; });
    const snaps = await tx.getAll(...Object.keys(need).map((pid) => db.doc(`products/${pid}`)));
    snaps.forEach((p) => { if (p.exists && typeof p.data().qty === "number") tx.update(p.ref, { qty: Math.max(0, p.data().qty + (hold ? -need[p.id] : need[p.id])) }); });
    tx.update(oref, { stockHeld: hold });
  });
}
const dead = (s) => s === "cancelled" || s === "failed";
exports.onOrderStock = onDocumentUpdated("orders/{id}", (e) => {
  const a = e.data.before.data(), b = e.data.after.data();
  return dead(a.status) === dead(b.status) ? null : setStock(e.params.id, !dead(b.status));
});

// Unpaid phone-prompt orders expire after 10 minutes (stock is released by onOrderStock).
exports.expireUnpaid = onSchedule("every 5 minutes", async () => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  const q = await db.collection("orders").where("status", "==", "awaiting payment").get();
  await Promise.all(q.docs.filter((d) => (d.data().created ? d.data().created.toMillis() : 0) < cutoff).map((d) =>
    db.runTransaction(async (tx) => { // re-check inside the transaction so a payment landing right now isn't overwritten
      const cur = (await tx.get(d.ref)).data();
      if (cur && cur.status === "awaiting payment") tx.update(d.ref, { status: "failed", expired: true, note: "Payment prompt timed out" });
    })));
});

// Safaricom calls this when the customer accepts or cancels the prompt.
exports.mpesaCallback = onRequest({ secrets: [MPESA_CB_TOKEN] }, async (req, res) => {
  const ok = (v) => res.json({ ResultCode: 0, ResultDesc: v || "OK" });
  if (!same(req.query.t, MPESA_CB_TOKEN.value())) return res.status(403).end();
  const cb = req.body && req.body.Body && req.body.Body.stkCallback;
  if (!cb) return ok();
  const q = await db.collection("orders").where("checkoutId", "==", cb.CheckoutRequestID).limit(1).get();
  if (q.empty) return ok();
  const ref = q.docs[0].ref, o = q.docs[0].data();
  const late = o.status === "failed" && o.expired === true; // money arrived after we timed the order out
  if (o.status !== "awaiting payment" && !(late && cb.ResultCode === 0)) return ok(); // already handled (Safaricom may retry)
  if (cb.ResultCode === 0) {
    const item = (n) => ((cb.CallbackMetadata && cb.CallbackMetadata.Item) || []).find((i) => i.Name === n)?.Value;
    if (Number(item("Amount")) < Math.ceil(o.dueNow)) await ref.update({ status: "payment to verify", note: "Amount paid was lower than expected" });
    else await ref.update({ status: "paid", mpesaCode: item("MpesaReceiptNumber") || null });
  } else await ref.update({ status: "failed", note: cb.ResultDesc || "Payment cancelled" });
  ok();
});

// ---------- emails ----------
async function notifyOrder(o) {
  const rows = o.lines.map((l) => `<li>${esc(l.name)}, size ${esc(l.size)} × ${l.qty}: ${kes(l.price * l.qty)}</li>`).join("");
  const body = `<ul>${rows}</ul><p><b>Total: ${kes(o.total)}</b> (${esc(o.method)}${o.dueNow < o.total ? `, ${kes(o.dueNow)} paid now, balance on delivery` : ""}${o.mpesaCode ? `, M-Pesa ${esc(o.mpesaCode)}` : ""})</p><p>Deliver to: ${esc(o.place)}<br>Phone: ${esc(o.phone)}</p>`;
  const jobs = [send(SELLER_EMAIL.value(), `New order #${o.id}`, `<h2>New order #${o.id}</h2><p>${esc(o.name)} &lt;${esc(o.email || "no email")}&gt;${o.guest ? " (guest)" : ""}</p>${body}`)];
  if (o.email) jobs.push(send(o.email, `Your HADAR order #${o.id}`, `<h2>Thank you for your order</h2><p>Order #${o.id} is received. We'll confirm on WhatsApp shortly.</p>${body}`));
  await Promise.allSettled(jobs);
}
// Pay-on-delivery / manual orders: email straight away. Phone-prompt orders: email only once paid.
exports.onOrderCreated = onDocumentCreated({ document: "orders/{id}", secrets: [SMTP_URL] }, (e) => {
  const o = e.data.data(); return o.status === "awaiting payment" ? null : notifyOrder(o);
});
exports.onOrderPaid = onDocumentUpdated({ document: "orders/{id}", secrets: [SMTP_URL] }, (e) => {
  const a = e.data.before.data(), b = e.data.after.data();
  return ["awaiting payment", "failed"].includes(a.status) && b.status === "paid" ? notifyOrder(b) : null;
});

// Welcome email on account creation (the verification email is sent by Firebase Auth itself).
exports.onSignup = v1.runWith({ secrets: ["SMTP_URL"] }).auth.user().onCreate((u) =>
  u.email ? send(u.email, "Welcome to HADAR Menswear", `<h2>Welcome${u.displayName ? ", " + esc(u.displayName) : ""}.</h2><p>Your account is ready. Style · Confidence · Distinction.</p>`).catch(console.error) : null);
