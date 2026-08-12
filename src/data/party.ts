import {
  doc,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb, isFirebaseConfigured } from '../lib/firebase'
import { travelerStorageKey } from './ratings'

export const PARTY_MAX = 4
export const partyTripId = 'hokkaido-2026'
export const deviceIdStorageKey = 'hokkaido-device-id'
export const travelerConfirmedStorageKey = 'hokkaido-traveler-confirmed'
export const partyRosterCacheKey = 'hokkaido-party-roster-v1'

export type PartyTraveler = {
  deviceId: string
  name: string
  confirmedAt: string
  updatedAt: string
}

export type PartyRoster = {
  travelers: PartyTraveler[]
}

export type PartyActionResult =
  | { ok: true; roster: PartyRoster }
  | { ok: false; reason: 'not_configured' | 'full' | 'duplicate_name' | 'not_member' | 'invalid_name' | 'error'; message: string }

const partyDocRef = (db: NonNullable<ReturnType<typeof getFirestoreDb>>) =>
  doc(db, 'trips', partyTripId)

export const getDeviceId = () => {
  try {
    const existing = localStorage.getItem(deviceIdStorageKey)
    if (existing) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(deviceIdStorageKey, next)
    return next
  } catch {
    return `device-temp-${Date.now().toString(36)}`
  }
}

export const readTravelerConfirmed = () => {
  try {
    return localStorage.getItem(travelerConfirmedStorageKey) === '1'
  } catch {
    return false
  }
}

export const writeTravelerConfirmed = (confirmed: boolean) => {
  localStorage.setItem(travelerConfirmedStorageKey, confirmed ? '1' : '0')
}

export const readRosterCache = (): PartyRoster => {
  try {
    const saved = JSON.parse(localStorage.getItem(partyRosterCacheKey) ?? '{"travelers":[]}')
    return {
      travelers: Array.isArray(saved?.travelers) ? saved.travelers : [],
    }
  } catch {
    return { travelers: [] }
  }
}

export const writeRosterCache = (roster: PartyRoster) => {
  localStorage.setItem(partyRosterCacheKey, JSON.stringify(roster))
}

export const normalizeTravelerName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const formatPartyReadyLine = (names: string[]) => {
  if (names.length === 0) return '还没有人就位'
  if (names.length >= PARTY_MAX) return `${names.join('、')} 已就位！`
  return `${names.join('、')} 已就位！还差 ${PARTY_MAX - names.length} 位`
}

const asRoster = (data: unknown): PartyRoster => {
  if (!data || typeof data !== 'object') return { travelers: [] }
  const travelers = (data as { travelers?: unknown }).travelers
  if (!Array.isArray(travelers)) return { travelers: [] }
  return {
    travelers: travelers
      .filter((item): item is PartyTraveler => {
        if (!item || typeof item !== 'object') return false
        const row = item as PartyTraveler
        return Boolean(row.deviceId && row.name)
      })
      .map((item) => ({
        deviceId: String(item.deviceId),
        name: normalizeTravelerName(String(item.name)),
        confirmedAt: String(item.confirmedAt || item.updatedAt || new Date().toISOString()),
        updatedAt: String(item.updatedAt || item.confirmedAt || new Date().toISOString()),
      })),
  }
}

export const subscribePartyRoster = (
  onChange: (roster: PartyRoster) => void,
  onError?: (message: string) => void,
): Unsubscribe | null => {
  const db = getFirestoreDb()
  if (!db) {
    onChange(readRosterCache())
    return null
  }

  return onSnapshot(
    partyDocRef(db),
    (snapshot) => {
      const roster = asRoster(snapshot.data())
      writeRosterCache(roster)
      onChange(roster)
    },
    (error) => {
      onError?.(error.message || '同步旅行者名单失败')
      onChange(readRosterCache())
    },
  )
}

export const joinParty = async (rawName: string): Promise<PartyActionResult> => {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: 'not_configured', message: '云端尚未配置，暂时无法加入' }
  }
  const name = normalizeTravelerName(rawName)
  if (!name || name.length > 16) {
    return { ok: false, reason: 'invalid_name', message: '请填写 1–16 个字的名字' }
  }

  const db = getFirestoreDb()
  if (!db) {
    return { ok: false, reason: 'not_configured', message: '云端尚未配置，暂时无法加入' }
  }

  const deviceId = getDeviceId()
  const now = new Date().toISOString()

  try {
    const roster = await runTransaction(db, async (transaction) => {
      const ref = partyDocRef(db)
      const snap = await transaction.get(ref)
      const current = asRoster(snap.data())
      const mine = current.travelers.find((item) => item.deviceId === deviceId)
      const duplicate = current.travelers.find(
        (item) => item.deviceId !== deviceId && item.name === name,
      )
      if (duplicate) {
        throw new Error('DUPLICATE')
      }
      if (mine) {
        const travelers = current.travelers.map((item) =>
          item.deviceId === deviceId ? { ...item, name, updatedAt: now } : item,
        )
        const next = { travelers }
        transaction.set(ref, next, { merge: true })
        return next
      }
      if (current.travelers.length >= PARTY_MAX) {
        throw new Error('FULL')
      }
      const next = {
        travelers: [
          ...current.travelers,
          { deviceId, name, confirmedAt: now, updatedAt: now },
        ],
      }
      transaction.set(ref, next, { merge: true })
      return next
    })

    writeRosterCache(roster)
    localStorage.setItem(travelerStorageKey, name)
    writeTravelerConfirmed(true)
    return { ok: true, roster }
  } catch (error) {
    if (error instanceof Error && error.message === 'FULL') {
      return { ok: false, reason: 'full', message: '4 位大人已经全部就位，无法再加入' }
    }
    if (error instanceof Error && error.message === 'DUPLICATE') {
      return { ok: false, reason: 'duplicate_name', message: '这个名字已被占用，换一个称呼吧' }
    }
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : '加入失败，请稍后再试',
    }
  }
}

export const renamePartyTraveler = async (rawName: string): Promise<PartyActionResult> => {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: 'not_configured', message: '云端尚未配置，暂时无法改名' }
  }
  const name = normalizeTravelerName(rawName)
  if (!name || name.length > 16) {
    return { ok: false, reason: 'invalid_name', message: '请填写 1–16 个字的名字' }
  }

  const db = getFirestoreDb()
  if (!db) {
    return { ok: false, reason: 'not_configured', message: '云端尚未配置，暂时无法改名' }
  }

  const deviceId = getDeviceId()
  const now = new Date().toISOString()

  try {
    const roster = await runTransaction(db, async (transaction) => {
      const ref = partyDocRef(db)
      const snap = await transaction.get(ref)
      const current = asRoster(snap.data())
      const mine = current.travelers.find((item) => item.deviceId === deviceId)
      if (!mine) {
        throw new Error('NOT_MEMBER')
      }
      const duplicate = current.travelers.find(
        (item) => item.deviceId !== deviceId && item.name === name,
      )
      if (duplicate) {
        throw new Error('DUPLICATE')
      }
      const travelers = current.travelers.map((item) =>
        item.deviceId === deviceId ? { ...item, name, updatedAt: now } : item,
      )
      const next = { travelers }
      transaction.set(ref, next, { merge: true })
      return next
    })

    writeRosterCache(roster)
    localStorage.setItem(travelerStorageKey, name)
    writeTravelerConfirmed(true)
    return { ok: true, roster }
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_MEMBER') {
      return { ok: false, reason: 'not_member', message: '你还不在旅行名单里，请先在首页加入' }
    }
    if (error instanceof Error && error.message === 'DUPLICATE') {
      return { ok: false, reason: 'duplicate_name', message: '这个名字已被占用，换一个称呼吧' }
    }
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : '改名失败，请稍后再试',
    }
  }
}

export const findMyTraveler = (roster: PartyRoster, deviceId = getDeviceId()) =>
  roster.travelers.find((item) => item.deviceId === deviceId)
