import { isFirebaseConfigured, readFirebaseConfig } from '../lib/firebaseConfig'
import { rateableTargets, type RatingRecord, type RatingScores } from './ratings'

export const deviceIdStorageKey = 'hokkaido-device-id'
export const nicknameStorageKey = 'hokkaido-trip-nickname'
export const ratingsCollection = 'tripRatings'
/** 线上规则若禁止 DELETE，就用这个昵称把记录藏起来（PATCH 仍可用） */
export const withdrawnTravelerName = '__deleted__'

export type CloudRatingRecord = RatingRecord & {
  deviceId: string
  /** Firestore 文档全名，清空时必须用这个，不能靠本地拼 ID */
  docPath?: string
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

const resourceUrl = (docPath: string) => {
  const config = readFirebaseConfig()
  if (!config || !docPath) return null
  const name = docPath.startsWith('projects/')
    ? docPath
    : `projects/${config.projectId}/databases/(default)/documents/${docPath.replace(/^\/+/, '')}`
  return `https://firestore.googleapis.com/v1/${name}?key=${encodeURIComponent(config.apiKey)}`
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
      scores: encodeScores({ ...(record.scores ?? {}), overall: record.stars }),
      // Live console rules still cap `stars` at 5; real 1–10 score is score10 + scores.overall.
      stars: encodeNumber(Math.min(5, Math.max(1, Number(record.stars) || 1))),
      score10: encodeNumber(Math.max(1, Math.min(10, Number(record.stars) || 1))),
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
      const denied = response.status === 403 || /PERMISSION_DENIED/i.test(text)
      if (denied) {
        return { ok: false, message: '云端拒绝写入，请再提交一次；分数已留在本机。' }
      }
      return { ok: false, message: `云端写入失败（${response.status}）` + (text ? `：${text.slice(0, 120)}` : '') }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: '网络异常，评分已留在本机，稍后可再同步' }
  }
}

const commentLooksWithdrawn = (fields: Record<string, FirestoreValue> | undefined) =>
  String(decodeValue(fields?.comment) ?? '') === withdrawnTravelerName

const parseCloudRecord = (
  fields: Record<string, FirestoreValue> | undefined,
  docPath?: string,
): CloudRatingRecord | null => {
  if (!fields) return null
  const targetId = String(decodeValue(fields.targetId) ?? '')
  const travelerName = String(decodeValue(fields.travelerName) ?? '').trim()
  const deviceId = String(decodeValue(fields.deviceId) ?? '').trim()
  if (!targetId || !travelerName) return null
  if (travelerName === withdrawnTravelerName || commentLooksWithdrawn(fields)) return null
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
    docPath,
    scores,
    stars: Number(decodeValue(fields.score10) || scores.overall || decodeValue(fields.stars) || 0),
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
      documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue> }>
    }
    const ratings = (payload.documents ?? [])
      .map((doc) => parseCloudRecord(doc.fields, doc.name))
      .filter((item): item is CloudRatingRecord => Boolean(item))
      .filter((item) => !item.targetId.startsWith('__'))
    return { ok: true, ratings }
  } catch {
    return { ok: false, message: '网络异常，暂时只显示本机评分', ratings: [] }
  }
}

const deleteCloudDocument = async (
  docPath: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  const url = resourceUrl(docPath)
  if (!url) return { ok: false, status: 0, message: '云端未配置' }
  try {
    const response = await fetch(url, { method: 'DELETE' })
    if (response.ok || response.status === 404) return { ok: true }
    const text = await response.text()
    return {
      ok: false,
      status: response.status,
      message: `云端删除失败（${response.status}）${text ? `：${text.slice(0, 80)}` : ''}`,
    }
  } catch {
    return { ok: false, status: 0, message: '网络异常，云端未能删除' }
  }
}

const patchCloudDocument = async (
  docPath: string,
  record: Omit<CloudRatingRecord, 'pendingSync'> & { pendingSync?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const url = resourceUrl(docPath)
  if (!url) return { ok: false, message: '云端未配置' }
  const body = {
    fields: {
      deviceId: encodeString(record.deviceId || 'unknown'),
      targetId: encodeString(record.targetId),
      travelerName: encodeString(record.travelerName),
      scores: encodeScores({ ...(record.scores ?? {}), overall: record.stars }),
      stars: encodeNumber(Math.min(5, Math.max(1, Number(record.stars) || 1))),
      score10: encodeNumber(Math.max(1, Math.min(10, Number(record.stars) || 1))),
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
      return { ok: false, message: `云端撤回失败（${response.status}）${text ? `：${text.slice(0, 80)}` : ''}` }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: '网络异常，云端未能撤回' }
  }
}

/** 按云端真实文档路径删除；规则拒绝删除时改为撤回 */
export const withdrawCloudRating = async (
  record: CloudRatingRecord,
): Promise<{ ok: true; mode: 'delete' | 'withdraw' } | { ok: false; message: string }> => {
  if (!record.docPath) {
    return { ok: false, message: '找不到云端文档路径，无法清空' }
  }
  const docPath = record.docPath
  const removed = await deleteCloudDocument(docPath)
  if (removed.ok) return { ok: true, mode: 'delete' }
  const hidden = await patchCloudDocument(docPath, {
    ...record,
    travelerName: withdrawnTravelerName,
    comment: withdrawnTravelerName,
    stars: 1,
    scores: { overall: 1 },
    updatedAt: new Date().toISOString(),
  })
  if (hidden.ok) return { ok: true, mode: 'withdraw' }
  return { ok: false, message: hidden.message || removed.message }
}

export const deleteCloudRatingsForTraveler = async (
  travelerName: string,
  day?: number,
): Promise<{ ok: true; removed: number } | { ok: false; message: string; removed: number }> => {
  const listed = await fetchCloudRatings()
  if (!listed.ok && listed.ratings.length === 0) {
    return { ok: false, message: listed.message, removed: 0 }
  }
  const name = travelerName.trim()
  const allowedIds = new Set(
    rateableTargets.filter((t) => (day == null ? true : t.day === day)).map((t) => t.id),
  )
  const mine = listed.ratings.filter(
    (item) => item.travelerName === name && allowedIds.has(item.targetId),
  )
  if (mine.length === 0) {
    return { ok: true, removed: 0 }
  }
  let removed = 0
  let lastError = ''
  for (const item of mine) {
    const result = await withdrawCloudRating(item)
    if (result.ok) removed += 1
    else lastError = result.message
  }
  return removed === mine.length
    ? { ok: true, removed }
    : { ok: false, message: lastError || '部分云端记录未能清空', removed }
}

export const averageOfRecords = (records: CloudRatingRecord[]) => {
  if (records.length === 0) return 0
  const sum = records.reduce((total, item) => total + (Number(item.stars) || 0), 0)
  return Math.round((sum / records.length) * 10) / 10
}

/** Shared itinerary flag, stored as a hidden ratings document so existing Firestore rules work. */
export const SWAP_FLAG_DOC_ID = 'itinerary_swap_day23'
export const SWAP_FLAG_TARGET_ID = '__swap_day23__'

export const fetchDay23SwapFlag = async (): Promise<
  { ok: true; swapped: boolean } | { ok: false; message: string; swapped: boolean | null }
> => {
  const url = documentsUrl(`${ratingsCollection}/${SWAP_FLAG_DOC_ID}`)
  if (!url) return { ok: false, message: '云端未配置', swapped: null }
  try {
    const response = await fetch(url)
    if (response.status === 404) return { ok: true, swapped: false }
    if (!response.ok) return { ok: false, message: `读取对调状态失败（${response.status}）`, swapped: null }
    const payload = (await response.json()) as { fields?: Record<string, FirestoreValue> }
    const comment = String(decodeValue(payload.fields?.comment) ?? '')
    const stars = Number(decodeValue(payload.fields?.stars) ?? 0)
    return { ok: true, swapped: comment === 'SWAP' || stars === 2 }
  } catch {
    return { ok: false, message: '网络异常，暂时用本机对调状态', swapped: null }
  }
}

export const pushDay23SwapFlag = async (swapped: boolean, operatorName: string) => {
  const url = documentsUrl(`${ratingsCollection}/${SWAP_FLAG_DOC_ID}`)
  if (!url) return { ok: false as const, message: '云端未配置' }
  const now = new Date().toISOString()
  const body = {
    fields: {
      deviceId: encodeString('trip-settings'),
      targetId: encodeString(SWAP_FLAG_TARGET_ID),
      travelerName: encodeString((operatorName || '洋葱').slice(0, 24)),
      scores: encodeScores({ overall: swapped ? 2 : 1 }),
      stars: encodeNumber(swapped ? 2 : 1),
      score10: encodeNumber(swapped ? 2 : 1),
      comment: encodeString(swapped ? 'SWAP' : 'NORMAL'),
      createdAt: encodeString(now),
      updatedAt: encodeString(now),
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
      return { ok: false as const, message: `云端写入失败（${response.status}）${text ? `：${text.slice(0, 80)}` : ''}` }
    }
    return { ok: true as const }
  } catch {
    return { ok: false as const, message: '网络异常，对调未同步到其他人的手机' }
  }
}
