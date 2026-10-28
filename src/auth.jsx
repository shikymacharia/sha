import { createContext, useContext, useEffect, useState } from 'react'
import { auth, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile } from './firebase.js'

const Ctx = createContext(null)
// UI-only check: the real enforcement is in firestore.rules.
export const isAdmin = (u) => !!u && u.emailVerified && (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).includes((u.email || '').toLowerCase())
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  const api = {
    user: user || null, loading: user === undefined,
    login: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    async signup(name, email, pw) {
      const { user: u } = await createUserWithEmailAndPassword(auth, email, pw)
      await updateProfile(u, { displayName: name })
      await sendEmailVerification(u) // Firebase sends the verification email itself
      setUser({ ...u }) // refresh name in UI
    },
    resend: () => sendEmailVerification(auth.currentUser),
    reset: (email) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
