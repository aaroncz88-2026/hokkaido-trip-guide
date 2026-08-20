import { isFirebaseConfigured, readFirebaseConfig } from '../lib/firebaseConfig'
import type { RatingRecord, RatingScores } from './ratings'

export const deviceIdStorageKey = 'hokkaido-device-id'
export const nicknameStorageKey = 'hokkaido-trip-nickname'
export const ratingsCollection = 'tripRatings'

export type CloudRatingRecord = RatingRecord & {
  deviceId: string
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { nullValue: null }

const encodeString = (value: string): FirestoreValue => ({ stringValue: value })
const encodeNumber = (value: number): FirestoreValue =>
  Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
const encodeBool = (value: boolean): FirestoreValue => ({ booleanValue: value })

const encodeScores = (scores: RatingScores): FirestoreValue => ({
  mapValue: {
    fields: Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, encodeNumber(Number(value) || 0)]),
    ),
  },
})

const decodeValue = (value: FirestoreValue | undefined): unknown => {
  if (!value) return undefined
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('mapValue' in value) {
    const fields = value.mapValue.fields ?? {}
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]))
  }
  return undefined
}

const documentsUrl = (path = '') => {
  const config = readFirebaseConfig()
  if (!config) return null
  const base = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`
  const suffix = path ? `/${path}` : ''
  return `${base}${suffix}?key=${encodeURIComponent(config.apiKey)}`
}

export const getDeviceId = () => {
  try {
    const existing = localStorage.getItem(deviceIdStorageKey)?.trim()
    if (existing) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(deviceIdStorageKey, next)
    return next
  } catch {
    return `dev-${Date.now()}`
  }
}

export const readNickname = () => {
  try {
    return (localStorage.getItem(nicknameStorageKey) ?? '').trim()
  } catch {
    return ''
  }
}

export const writeNickname = (name: string) => {
  localStorage.setItem(nicknameStorageKey, name.trim())
}

export const ratingDocId = (deviceId: string, targetId: string) =>
  `${deviceId}__${targetId}`.replace(/[^a-zA-Z0-9_\-]/g, '_')

export const isRatingCloudConfigured = () => isFirebaseConfigured()

export const pushRatingToCloud = async (
  record: Omit<CloudRatingRecord, 'pendingSync'> & { pendingSync?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const url = documentsUrl(`${ratingsCollection}/${ratingDocId(record.deviceId, record.targetId)}`)
  if (!url) return { ok: false, message: '云端未配置' }

  const body = {
    fields: {
      deviceId: encodeString(record.deviceId),
      targetId: encodeString(record.targetId),
      travelerName: encodeString(record.travelerName),
      scores: encodeScores(record.scores ?? {}),
      stars: encodeNumber(record.stars),
      comment: encodeString(record.comment ?? ''),
      createdAt: encodeString(record.createdAt),
      updatedAt: encodeString(record.updatedAt),
      pendingSync: encodeBool(false),
    },
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text()
      return { ok: false, message: `云端写入失败（${response.status}）` + (text ? `：${text.slice(0, 120)}` : '') }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: '网络异常，评分已留在本机，稍后可再同步' }
  }
}

const parseCloudRecord = (fields: Record<string, FirestoreValue> | undefined): CloudRatingRecord | null => {
  if (!fields) return null
  const targetId = String(decodeValue(fields.targetId) ?? '')
  const travelerName = String(decodeValue(fields.travelerName) ?? '').trim()
  const deviceId = String(decodeValue(fields.deviceId) ?? '').trim()
  if (!targetId || !travelerName || !deviceId) return null
  const scoresRaw = decodeValue(fields.scores)
  const scores =
    scoresRaw && typeof scoresRaw === 'object'
      ? (Object.fromEntries(
          Object.entries(scoresRaw as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0]),
        ) as RatingScores)
      : {}
  return {
    targetId,
    travelerName,
    deviceId,
    scores,
    stars: Number(decodeValue(fields.stars) ?? 0),
    comment: String(decodeValue(fields.comment) ?? ''),
    createdAt: String(decodeValue(fields.createdAt) ?? new Date().toISOString()),
    updatedAt: String(decodeValue(fields.updatedAt) ?? new Date().toISOString()),
    pendingSync: false,
  }
}

export const fetchCloudRatings = async (): Promise<
  { ok: true; ratings: CloudRatingRecord[] } | { ok: false; message: string; ratings: CloudRatingRecord[] }
> => {
  const url = documentsUrl(ratingsCollection)
  if (!url) return { ok: false, message: '云端未配置', ratings: [] }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { ok: false, message: `拉取失败（${response.status}）`, ratings: [] }
    }
    const payload = (await response.json()) as {
      documents?: Array<{ fields?: Record<string, FirestoreValue> }>
    }
    const ratings = (payload.documents ?? [])
      .map((doc) => parseCloudRecord(doc.fields))
      .filter((item): item is CloudRatingRecord => Boolean(item))
    return { ok: true, ratings }
  } catch {
    return { ok: false, message: '网络异常，暂时只显示本机评分', ratings: [] }
  }
}

export const averageOfRecords = (records: CloudRatingRecord[]) => {
  if (records.length === 0) return 0
  const sum = records.reduce((total, item) => total + (Number(item.stars) || 0), 0)
  return Math.round((sum / records.length) * 10) / 10
}
