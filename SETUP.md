# HADAR backend setup (Firebase)

## Easiest: no software on your computer (Google Cloud Shell)
1. In the Firebase console (project hadar-e312b): **Upgrade to the Blaze plan** (needed for Cloud Functions; the free allowance still applies) and, under **Authentication → Get started → Sign-in method**, turn on **Email/Password**.
2. Open https://console.cloud.google.com, make sure the project hadar-e312b is selected, and click the **>_ Activate Cloud Shell** button at the top right. A terminal opens in your browser.
3. In Cloud Shell choose the menu (⋮) → **Upload**, and upload SHA-backend-v7.zip. Then type:
   `unzip SHA-backend-v7.zip && cd SHA && bash deploy.sh`
4. Answer the prompts (admin email, order-alert email, email login). It builds and deploys everything and prints your shop address.

The older manual steps are below for reference.


1. Firebase console (project hadar-e312b): enable **Authentication → Email/Password**, create **Firestore** (production mode), and upgrade to the **Blaze** plan (required for Cloud Functions; free tier still applies).
2. Copy `.env.example` to `.env` and fill in the web app keys (Project settings → Your apps).
3. Edit `firestore.rules` (your admin email) and `functions/.env.hadar-e312b` (SELLER_EMAIL, MAIL_FROM).
4. Email: `firebase functions:secrets:set SMTP_URL` with e.g. `smtps://you@gmail.com:APP_PASSWORD@smtp.gmail.com` (Gmail app password, or any SMTP provider such as Brevo/Resend SMTP).
5. `npm install` then `npm run seed` (needs a service-account key in GOOGLE_APPLICATION_CREDENTIALS) to load the products into Firestore.
6. `firebase deploy --only firestore:rules,functions` then `npm run firebase:deploy`.

Verification and password-reset emails are sent by Firebase Auth itself. Order and welcome emails are sent by the functions.
Old files from the earlier Kuvaa/Express version are in `_legacy/` and can be deleted.

## Admin dashboard
- Set `VITE_ADMIN_EMAILS` in `.env` and the same email in `firestore.rules` (the rules are what actually protect the data). Sign up with that email, verify it, then open `/admin` (or the button on `/account`).
- Orders: live list, change status, message the customer on WhatsApp. Products: add, edit, delete, or "Load starter products" on an empty shop. Images are URLs for now.

## M-Pesa phone prompt (Daraja STK push)
1. Create an app at developer.safaricom.co.ke (sandbox first). Note the consumer key, consumer secret, shortcode and passkey.
2. `firebase functions:secrets:set` for each of: `MPESA_KEY`, `MPESA_SECRET`, `MPESA_PASSKEY`, `MPESA_CB_TOKEN` (any long random string). These secrets must exist before you deploy, even in dummy form, because placeOrder declares them.
3. Put `MPESA_SHORTCODE` (and `MPESA_TILL` plus `MPESA_TYPE=CustomerBuyGoodsOnline` for a till) in `functions/.env.hadar-e312b`.
4. Deploy once, copy the `mpesaCallback` URL from the deploy output into `MPESA_CALLBACK_URL`, and deploy again.
5. For production set `MPESA_ENV=production` with your live credentials. Until `MPESA_SHORTCODE` and `MPESA_CALLBACK_URL` are both set, checkout keeps the WhatsApp flow.

How it works: placeOrder saves the order as "awaiting payment" and triggers the prompt. The customer approves it on their phone, Safaricom calls mpesaCallback, and the order flips to "paid" with the M-Pesa receipt code. The checkout screen updates live, and the order emails go out once it is paid. A prompt that is cancelled or times out marks the order "failed". An underpayment goes to "payment to verify".

## Stock counts and expiry
- Give a product a **Stock quantity** in the admin dashboard and it is counted: the shop shows "Only N left" at 5 or fewer and "Sold out" at 0, and placeOrder refuses to oversell (checked inside a transaction, so two customers can't take the last item). Leave it blank and the product is not counted.
- Stock is taken when an order is placed and returned automatically if the order becomes **cancelled** or **failed** (including when you set that in the admin dashboard). Moving it back to an active status takes the stock again.
- Phone-prompt orders still "awaiting payment" after 10 minutes are marked failed by a scheduled function (`expireUnpaid`, runs every 5 minutes; Firebase enables Cloud Scheduler for you on deploy). If the customer's payment lands after that, the callback still accepts it and the order goes to paid.
- Existing products in Firestore have no count yet: open each in the admin dashboard and set one, or delete them and use "Load starter products" (starter counts: 20, or 4 for items marked Low Stock).

## Catalog and preview
- `src/products.js` holds 19 shirts with your photos (in `public/products/`) plus 11 other items (tees, polos, trousers, jeans, jackets, hoodie) that use drawn placeholders until you have photos. Replace them in `/admin` (paste an image URL) or by adding photos to `public/products/`.
- After changing products.js, use `/admin` → Products → "Load starter products" on an empty shop, or `npm run seed`, to push the catalog to Firestore.
- `PREVIEW=1 VITE_PREVIEW=1 npm run build` makes a demo build with Firebase replaced by in-memory stubs, so the storefront runs without a backend.

## Guest checkout
Customers can order without an account: the cart asks for name, phone, delivery location and (optionally) an email for the receipt. Guest orders go through the same backend as everyone else (stock, M-Pesa prompt, emails, admin dashboard) and are marked "(guest)" in the seller email. Guests follow payment progress with a private order token instead of a login. To limit abuse there is a cap of 4 orders per phone and 8 per connection per hour, and no second M-Pesa prompt while one is still waiting. Signing in is optional and only adds an order history page.

## Brands and size options
Each product has a **brand** and a list of **sizes available**. The shop shows brand chips (Tommy High, Patched Hill, Benletti Homme, HADAR) and each card offers only the sizes listed for that product: S to XXL for shirts, tees and jackets, waist 30 to 38 for trousers. In `/admin` → Products, set "Brand" and "Sizes available" (comma-separated) for any product, for example `S, M, L` when XL is sold out.

## Managing products from /admin (no rebuild or redeploy needed)
Open `/admin` → **Products**. Changes appear on the live shop immediately.
- **Add a product:** *Add product*, fill in name, price, sizes (comma-separated, e.g. `S, M, L, XL`), stock quantity and an image URL, then *Save*. Leave stock blank and it is not counted.
- **Edit:** *Edit* on any product, change fields, *Save*.
- **Sold out / restock:** *Mark sold out* sets stock to 0 (the shop shows "Sold out" and orders are refused). *Restock* asks how many are available.
- **Bulk price change:** choose all products or one category, pick Percent or Amount, enter a number (negative to reduce, e.g. `-10` for 10% off) and *Apply*. You get a confirmation with an example first. Original prices are kept so reductions show as discounts.
- **Delete:** *Delete* removes the product permanently.
- **Images:** paste a link to a hosted image, or add photos to `public/products/` and redeploy.
