import { travelerStorageKey } from './ratings'

export const PARTY_MAX = 4

/** Fixed adult party — no cloud sync; each device claims one seat locally. */
export const FIXED_TRAVELER_NAMES = ['洋葱', 'COS女王', '菜菜', '低调先森'] as const

export type FixedTravelerName = (typeof FIXED_TRAVELER_NAMES)[number]

export const travelerConfirmedStorageKey = 'hokkaido-traveler-confirmed'

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
  | {
      ok: false
      reason: 'invalid_name' | 'error'
      message: string
    }

export const fixedPartyRoster = (): PartyRoster => ({
  travelers: FIXED_TRAVELER_NAMES.map((name, index) => ({
    deviceId: `seat-${index + 1}`,
    name,
    confirmedAt: '',
    updatedAt: '',
  })),
})

export const normalizeTravelerName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const isFixedTravelerName = (name: string): name is FixedTravelerName =>
  (FIXED_TRAVELER_NAMES as readonly string[]).includes(normalizeTravelerName(name))

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

export const readClaimedTravelerName = () => {
  try {
    const name = normalizeTravelerName(localStorage.getItem(travelerStorageKey) ?? '')
    if (!name || !isFixedTravelerName(name) || !readTravelerConfirmed()) return ''
    return name
  } catch {
    return ''
  }
}

export const formatPartyTitle = (isMember: boolean) => {
  if (isMember) return '北海道旅程，正式启动'
  return '我是此次旅行的谁'
}

export const formatPartyReadyLine = () =>
  `旅行者为：${FIXED_TRAVELER_NAMES.join('、')}及两个可爱的宝宝，瓜瓜和小骑士`

export const claimTravelerSeat = (rawName: string): PartyActionResult => {
  const name = normalizeTravelerName(rawName)
  if (!isFixedTravelerName(name)) {
    return { ok: false, reason: 'invalid_name', message: '请从四人名单里选择你的名字' }
  }
  localStorage.setItem(travelerStorageKey, name)
  writeTravelerConfirmed(true)
  return { ok: true, roster: fixedPartyRoster() }
}

export const findMyTraveler = (roster: PartyRoster, name: string) => {
  const claimed = normalizeTravelerName(name)
  return roster.travelers.find((item) => item.name === claimed)
}
