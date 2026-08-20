export type FirebaseWebConfig = {
  apiKey: string
  projectId: string
}

export const readFirebaseConfig = (): FirebaseWebConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim()
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (!apiKey || !projectId) return null
  return { apiKey, projectId }
}

export const isFirebaseConfigured = () => Boolean(readFirebaseConfig())
