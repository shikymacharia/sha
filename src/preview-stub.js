// Used only by the preview build: replaces Firebase with in-memory demo behaviour.
let cur = null; const subs = new Set(); const emit = () => subs.forEach((f) => f(cur ? { ...cur } : null))
export const initializeApp = () => ({}); export const getAuth = () => ({}); export const getFirestore = () => ({}); export const getFunctions = () => ({})
export const onAuthStateChanged = (_a, cb) => { subs.add(cb); setTimeout(() => cb(cur ? { ...cur } : null)); return () => subs.delete(cb) }
const mk = (email, name) => { cur = { uid: 'demo', email, displayName: name || email.split('@')[0], emailVerified: true }; emit(); return { user: cur } }
export const signInWithEmailAndPassword = async (_a, email) => mk(email)
export const createUserWithEmailAndPassword = async (_a, email) => mk(email)
export const updateProfile = async (u, p) => { cur = { ...cur, ...p }; emit() }
export const sendEmailVerification = async () => {}; export const sendPasswordResetEmail = async () => {}
export const signOut = async () => { cur = null; emit() }
export const collection = () => ({}); export const query = () => ({}); export const where = () => ({}); export const doc = () => ({})
export const onSnapshot = (_r, cb) => { cb({ docs: [] }); return () => {} }
export const setDoc = async () => {}; export const updateDoc = async () => {}; export const deleteDoc = async () => {}
export const httpsCallable = () => async () => ({ data: { id: 'DEMO' + Math.floor(Math.random() * 90 + 10), stk: false, token: 'demo' } })
