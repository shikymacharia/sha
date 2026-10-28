// One-off: copies src/products.js into Firestore. Run: GOOGLE_APPLICATION_CREDENTIALS=key.json node scripts/seed.mjs
import admin from 'firebase-admin'
import { defaultProducts } from '../src/products.js'
admin.initializeApp({ projectId: 'hadar-e312b' })
const db = admin.firestore()
for (const p of defaultProducts) await db.doc(`products/${p.id}`).set(p)
console.log(`Seeded ${defaultProducts.length} products`)
