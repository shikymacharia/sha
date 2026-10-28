#!/usr/bin/env bash
# One-shot setup + deploy for HADAR. Run it in Google Cloud Shell (a terminal in your browser):  bash deploy.sh
# Safe to run again: it reuses what already exists.
set -e
PROJECT=hadar-e312b
cd "$(dirname "$0")"

echo "== 1/6  Firebase login =="
command -v firebase >/dev/null || npm install -g firebase-tools
firebase projects:list >/dev/null 2>&1 || firebase login --no-localhost

echo; echo "== 2/6  A few questions =="
read -r -p "Your admin email (the one you will sign up with): " ADMIN
read -r -p "Email that should receive order alerts [$ADMIN]: " SELLER; SELLER=${SELLER:-$ADMIN}
echo "Email sending login, e.g. smtps://you%40gmail.com:APP_PASSWORD@smtp.gmail.com"
echo "(Gmail: turn on 2-step verification, create an 'App password', and write @ in your address as %40)"
read -r -s -p "SMTP login URL (typing is hidden): " SMTP; echo

echo; echo "== 3/6  Writing configuration =="
sed -i "s/REPLACE_WITH_ADMIN_EMAIL/$ADMIN/" firestore.rules
cat > "functions/.env.$PROJECT" <<ENV
SELLER_EMAIL=$SELLER
MAIL_FROM=HADAR Menswear <$SELLER>
MPESA_SHORTCODE=
MPESA_TILL=
MPESA_TYPE=CustomerPayBillOnline
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=
ENV
find_app() { firebase apps:list WEB --project "$PROJECT" 2>/dev/null | grep -o '1:[0-9]*:web:[a-z0-9]*' | head -1; }
APP_ID=$(find_app || true)
if [ -z "$APP_ID" ]; then firebase apps:create WEB HADAR --project "$PROJECT"; APP_ID=$(find_app); fi
API_KEY=$(firebase apps:sdkconfig WEB "$APP_ID" --project "$PROJECT" | grep -o 'AIza[0-9A-Za-z_-]*' | head -1)
[ -n "$API_KEY" ] && [ -n "$APP_ID" ] || { echo "Could not read the Firebase web config. Copy it from Project settings into .env by hand."; exit 1; }
cat > .env <<ENV
VITE_FIREBASE_API_KEY=$API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=$PROJECT
VITE_FIREBASE_APP_ID=$APP_ID
VITE_ADMIN_EMAILS=$ADMIN
ENV

echo; echo "== 4/6  Database and secrets =="
firebase firestore:databases:create '(default)' --location nam5 --project "$PROJECT" 2>&1 | tail -2 || true
printf %s "$SMTP" | firebase functions:secrets:set SMTP_URL --project "$PROJECT" --data-file - --force
openssl rand -hex 24 | tr -d '\n' | firebase functions:secrets:set MPESA_CB_TOKEN --project "$PROJECT" --data-file - --force
for s in MPESA_KEY MPESA_SECRET MPESA_PASSKEY; do   # placeholders until you connect M-Pesa (see SETUP.md)
  printf unset | firebase functions:secrets:set "$s" --project "$PROJECT" --data-file - --force
done

echo; echo "== 5/6  Building the site =="
npm install --no-audit --no-fund
npm run build

echo; echo "== 6/6  Deploying =="
firebase deploy --project "$PROJECT" --only firestore:rules,functions,hosting
node scripts/seed.mjs || echo "(Could not load products automatically. Log in as admin and press 'Load starter products' on /admin.)"

echo; echo "Done. Your shop: https://$PROJECT.web.app"
echo "Next: open it, create an account with $ADMIN, verify the email, then go to /admin."
