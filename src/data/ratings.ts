import { tripDays, type TimelineItem } from './trip'
import { parseTimelineRange } from '../lib/clock'

export type RateableKind = 'spot' | 'meal' | 'experience'

export type RateableTarget = {
  id: string
  day: number
  date: string
  weekday: string
  time: string
  title: string
  detail: string
  kind: RateableKind
  unlockAt: string
}

export type RatingRecord = {
  targetId: string
  travelerName: string
  stars: number
  comment: string
  createdAt: string
  updatedAt: string
  /** Reserved for future cloud DB sync */
  pendingSync: boolean
}

const RATEABLE_RE =
  /景点|晚餐|午餐|早餐|食堂|餐厅|美食|游乐|乐园|公园|农场|牧场|缆车|Cruise|温泉|运河|火山|青池|瀑布|露台|美术馆|博物馆|烟花|羊蹄|有珠|支笏|洞爷|龙宫|堺町|手宫|大地|恋人|定山溪|Greenland|诺ロッコ|羊驼|野餐|町|硝子|音乐盒|LeTAO|アペコロ|居酒屋|Oktoberfest|湖|港|船|夜景|花田|富田|四季彩/

const EXCLUDE_RE =
  /起床|睡觉|洗漱|整理行李|退房|出发|抵达机场|值机|安检|过关|取车|还车|车程|移动|前往|开车|休息|采购次日|垃圾分类/

const mealRe = /晚餐|午餐|早餐|食堂|餐厅|美食|居酒屋|Oktoberfest|アペコロ|野餐|GAjA|唐吉诃德/

export const ratingsStorageKey = 'hokkaido-ratings-v1'
export const travelerStorageKey = 'hokkaido-traveler-name'

const dayUnlockDate = (date: string, endMinutes: number) => {
  const [year, month, day] = date.split('-').map(Number)
  const hours = Math.floor(endMinutes / 60)
  const minutes = endMinutes % 60
  if (hours >= 24) {
    return new Date(year, month - 1, day + 1, hours - 24, minutes, 0, 0)
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

const classifyKind = (item: TimelineItem): RateableKind => {
  const text = `${item.title} ${item.detail} ${item.tags.join(' ')}`
  if (mealRe.test(text)) return 'meal'
  if (/游乐|乐园|Cruise|缆车|烟花|任务/.test(text)) return 'experience'
  return 'spot'
}

const isRateable = (item: TimelineItem) => {
  if (item.isRest) return false
  const text = `${item.title} ${item.detail} ${item.tags.join(' ')}`
  if (EXCLUDE_RE.test(text) && !RATEABLE_RE.test(text)) return false
  return RATEABLE_RE.test(text) || item.tags.some((tag) => RATEABLE_RE.test(tag))
}

export const kindLabel = (kind: RateableKind) => {
  if (kind === 'meal') return '用餐'
  if (kind === 'experience') return '体验'
  return '景点'
}

export const buildRateableTargets = (): RateableTarget[] =>
  tripDays.flatMap((day) =>
    day.timeline
      .filter(isRateable)
      .map((item) => {
        const range = parseTimelineRange(item.time)
        const endMinutes = range?.end ?? 18 * 60
        const unlockAt = dayUnlockDate(day.date, endMinutes)
        return {
          id: item.id,
          day: day.day,
          date: day.date,
          weekday: day.weekday,
          time: item.time,
          title: item.title,
          detail: item.detail,
          kind: classifyKind(item),
          unlockAt: unlockAt.toISOString(),
        }
      }),
  )

export const rateableTargets = buildRateableTargets()

export const isTargetUnlocked = (target: RateableTarget, now: Date) =>
  now.getTime() >= new Date(target.unlockAt).getTime()

export const readRatings = (): RatingRecord[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(ratingsStorageKey) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export const writeRatings = (ratings: RatingRecord[]) => {
  localStorage.setItem(ratingsStorageKey, JSON.stringify(ratings))
}

export const upsertRating = (
  ratings: RatingRecord[],
  input: { targetId: string; travelerName: string; stars: number; comment: string },
): RatingRecord[] => {
  const travelerName = input.travelerName.trim()
  const now = new Date().toISOString()
  const existing = ratings.find(
    (item) => item.targetId === input.targetId && item.travelerName === travelerName,
  )
  if (existing) {
    return ratings.map((item) =>
      item === existing
        ? {
            ...item,
            stars: input.stars,
            comment: input.comment.trim(),
            updatedAt: now,
            pendingSync: true,
          }
        : item,
    )
  }
  return [
    ...ratings,
    {
      targetId: input.targetId,
      travelerName,
      stars: input.stars,
      comment: input.comment.trim(),
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    },
  ]
}

export const getTravelerRating = (
  ratings: RatingRecord[],
  targetId: string,
  travelerName: string,
) => ratings.find((item) => item.targetId === targetId && item.travelerName === travelerName.trim())

export const countPendingRatings = (
  ratings: RatingRecord[],
  travelerName: string,
  now: Date,
) => {
  const name = travelerName.trim()
  if (!name) return 0
  return rateableTargets.filter(
    (target) => isTargetUnlocked(target, now) && !getTravelerRating(ratings, target.id, name),
  ).length
}
