import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const readConfig = (): FirebaseWebConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim()
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim()
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim()
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim()

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
}

let app: FirebaseApp | null = null
let db: Firestore | null = null

export const isFirebaseConfigured = () => readConfig() != null

export const getFirestoreDb = (): Firestore | null => {
  const config = readConfig()
  if (!config) return null
  if (!app) app = initializeApp(config)
  if (!db) db = getFirestore(app)
  return db
}
