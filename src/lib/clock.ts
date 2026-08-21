import { tripDays, type DayPlan, type TimelineItem } from '../data/trip'

export const TRIP_START = new Date('2026-08-23T00:00:00+08:00')
export const TRIP_END = new Date('2026-08-30T23:59:59+08:00')

const STORAGE_KEY = 'hokkaido-sim-offset'

export type CurrentActivity = {
  day: DayPlan
  item: TimelineItem
  navigation?: { label: string; query: string }
}

export const readSimOffset = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (raw == null || raw === '') return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export const writeSimOffset = (offsetMs: number | null) => {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    if (offsetMs == null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(offsetMs))
  } catch {
    // ignore private-mode / quota failures
  }
}

export const getAppNow = (offsetMs: number | null = readSimOffset()) =>
  new Date(Date.now() + (offsetMs ?? 0))

export const toDatetimeLocalValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const parseDatetimeLocalValue = (value: string) => {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, y, m, d, hh, mm] = match.map(Number)
  const date = new Date(y, m - 1, d, hh, mm, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatSimClock = (date: Date) => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getMonth() + 1}月${date.getDate()}日 周${weekdays[date.getDay()]} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const parseClockMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours === 24 && minutes === 0) return 24 * 60
  if (hours > 24 || minutes > 59) return null
  return hours * 60 + minutes
}

export const parseTimelineRange = (time: string) => {
  const [startRaw, endRaw] = time.split('~').map((part) => part.trim())
  const start = parseClockMinutes(startRaw)
  if (start == null) return null
  const end = endRaw ? parseClockMinutes(endRaw) : start + 60
  if (end == null) return null
  return { start, end }
}

const dayStartMs = (day: DayPlan) => {
  const [year, month, date] = day.date.split('-').map(Number)
  return new Date(year, month - 1, date, 0, 0, 0, 0).getTime()
}

const matchNavigation = (day: DayPlan, item: TimelineItem) => {
  const haystack = `${item.title} ${item.detail} ${item.tags.join(' ')}`
  if (/午餐/.test(haystack)) {
    const lunch = day.navigation.find((nav) => nav.label.includes('午餐'))
    if (lunch) return lunch
  }
  if (/晚餐|晚饭/.test(haystack)) {
    const dinner = day.navigation.find((nav) => nav.label.includes('晚餐'))
    if (dinner) return dinner
  }
  return (
    day.navigation.find((nav) => haystack.includes(nav.label) || item.detail.includes(nav.query)) ??
    day.navigation.find((nav) =>
      nav.label
        .split(/[·・／/]/)
        .some((piece) => piece && haystack.includes(piece.trim())),
    )
  )
}

/** Resolve the trip segment that should be active at `now` (foundation for live prompts). */
export const getCurrentActivity = (now: Date): CurrentActivity | null => {
  if (now < TRIP_START || now > TRIP_END) return null

  const day =
    tripDays.find((candidate) => {
      const start = dayStartMs(candidate)
      const end = start + 86_400_000
      return now.getTime() >= start && now.getTime() < end
    }) ?? null

  if (!day || day.timeline.length === 0) return null

  const minutes = now.getHours() * 60 + now.getMinutes()
  const active =
    day.timeline.find((item) => {
      const range = parseTimelineRange(item.time)
      if (!range) return false
      if (range.end > range.start) return minutes >= range.start && minutes < range.end
      // overnight window, e.g. 22:00~4:00
      return minutes >= range.start || minutes < range.end
    }) ?? null

  if (!active) return null
  return {
    day,
    item: active,
    navigation: matchNavigation(day, active),
  }
}
