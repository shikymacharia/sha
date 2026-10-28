import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// `PREVIEW=1 npm run build` makes a demo build with Firebase replaced by in-memory stubs (no backend needed).
const stub = fileURLToPath(new URL('./src/preview-stub.js', import.meta.url))
const alias = process.env.PREVIEW
  ? Object.fromEntries(['app', 'auth', 'firestore', 'functions'].map((m) => [`firebase/${m}`, stub]))
  : {}
export default defineConfig({ plugins: [react(), tailwindcss()], resolve: { alias } })
