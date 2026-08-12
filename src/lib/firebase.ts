import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore'
import { readFirebaseConfig } from './firebaseConfig'

export { isFirebaseConfigured } from './firebaseConfig'

let app: FirebaseApp | null = null
let db: Firestore | null = null

export const getFirestoreDb = (): Firestore | null => {
  const config = readFirebaseConfig()
  if (!config) return null
  if (!app) app = initializeApp(config)
  if (!db) {
    try {
      // Long polling is more resilient on restricted mobile networks.
      db = initializeFirestore(app, { experimentalForceLongPolling: true })
    } catch {
      db = getFirestore(app)
    }
  }
  return db
}

export const cloudUnreachableMessage =
  '连不上旅行名单云端（国内访问 Google/Firebase 常会很慢或失败）。可先浏览行程；换 Wi‑Fi/手机热点后再试加入。'
