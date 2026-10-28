import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword, getAuth as fbGetAuth, onAuthStateChanged as fbOnAuthStateChanged, sendEmailVerification as fbSendEmailVerification, sendPasswordResetEmail as fbSendPasswordResetEmail, signInWithEmailAndPassword as fbSignInWithEmailAndPassword, signOut as fbSignOut, updateProfile as fbUpdateProfile } from 'firebase/auth'
import { collection as fbCollection, deleteDoc as fbDeleteDoc, doc as fbDoc, getFirestore as fbGetFirestore, onSnapshot as fbOnSnapshot, query as fbQuery, setDoc as fbSetDoc, updateDoc as fbUpdateDoc, where as fbWhere } from 'firebase/firestore'
import { getFunctions as fbGetFunctions, httpsCallable as fbHttpsCallable } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasValidFirebaseConfig = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim().length > 0 && !value.includes('YOUR_') && !value.includes('your_'))

let app = null
let realAuth = null
let realDb = null
let realFns = null

if (hasValidFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig)
    realAuth = fbGetAuth(app)
    realDb = fbGetFirestore(app)
    realFns = fbGetFunctions(app)
  } catch (error) {
    console.warn('Firebase is not configured correctly, so HADAR is running in demo mode.', error.message)
  }
}

const demoUser = (email = 'demo@example.com', name) => ({
  uid: 'demo-user',
  email,
  displayName: name || email.split('@')[0],
  emailVerified: true,
})

const noop = () => {}
const noOpOnSnapshot = (callback) => {
  callback({ docs: [] })
  return noop
}

export const auth = realAuth || { currentUser: null }
export const db = realDb || null

export const onAuthStateChanged = (currentAuth, callback) => {
  if (!realAuth || !currentAuth) {
    callback(null)
    return noop
  }
  return fbOnAuthStateChanged(currentAuth, callback)
}

export const createUserWithEmailAndPassword = async (currentAuth, email, password) => {
  if (!realAuth || !currentAuth) {
    return { user: demoUser(email) }
  }
  return fbCreateUserWithEmailAndPassword(currentAuth, email, password)
}

export const signInWithEmailAndPassword = async (currentAuth, email, password) => {
  if (!realAuth || !currentAuth) {
    return { user: demoUser(email) }
  }
  return fbSignInWithEmailAndPassword(currentAuth, email, password)
}

export const updateProfile = async (user, profile) => {
  if (!realAuth) return user
  return fbUpdateProfile(user, profile)
}

export const sendEmailVerification = async (user) => {
  if (!realAuth) return undefined
  return fbSendEmailVerification(user)
}

export const sendPasswordResetEmail = async (currentAuth, email) => {
  if (!realAuth) return undefined
  return fbSendPasswordResetEmail(currentAuth, email)
}

export const signOut = async (currentAuth) => {
  if (!realAuth) return undefined
  return fbSignOut(currentAuth)
}

export const collection = (...args) => (realDb ? fbCollection(...args) : { __demo: true })
export const query = (...args) => (realDb ? fbQuery(...args) : { __demo: true })
export const where = (...args) => (realDb ? fbWhere(...args) : { __demo: true })
export const doc = (...args) => (realDb ? fbDoc(...args) : { __demo: true })
export const onSnapshot = (source, callback, onError) => {
  if (!realDb) return noOpOnSnapshot(callback)
  return fbOnSnapshot(source, callback, onError)
}
export const setDoc = async (...args) => {
  if (!realDb) return undefined
  return fbSetDoc(...args)
}
export const updateDoc = async (...args) => {
  if (!realDb) return undefined
  return fbUpdateDoc(...args)
}
export const deleteDoc = async (...args) => {
  if (!realDb) return undefined
  return fbDeleteDoc(...args)
}

export const placeOrder = realFns ? fbHttpsCallable(realFns, 'placeOrder') : async () => ({ data: { id: 'DEMO-' + Date.now(), stk: false, token: 'demo' } })
export const orderStatus = realFns ? fbHttpsCallable(realFns, 'orderStatus') : async () => ({ data: { status: 'demo' } })
