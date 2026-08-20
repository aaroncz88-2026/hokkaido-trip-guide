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

export const ratingsStorageKey = 'hokkaido-ratings-v2'
export const travelerStorageKey = 'hokkaido-traveler-name'

/** 当天晚上 20:00 起开放该日全部打分项 */
const dayUnlockAt20 = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 20, 0, 0, 0).toISOString()
}

type CuratedSeed = Omit<RateableTarget, 'unlockAt' | 'time'> & { time?: string }

/**
 * 手工维护：不是每个景点/每顿饭都要评。
 * 之后按天追加即可；目前只开 DAY1（湖景 + 湖上体验 + 晚餐 = 3 段）。
 */
const curatedSeeds: CuratedSeed[] = [
  {
    id: 'day1-shikotsu-lake',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '支笏湖 · 湖景',
    detail: '湖边风景、停车场周边走走的整体感觉',
    kind: 'spot',
  },
  {
    id: 'day1-shikotsu-boat',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '支笏湖 · 观光船／湖上体验',
    detail: '观光船、天鹅船或湖上相关体验（没坐船也可按湖边活动评）',
    kind: 'experience',
  },
  {
    id: 'day1-dinner-genbee',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '晚餐 · 源べえ',
    detail: '留寿都源べえ晚饭口味、服务与亲子友好度',
    kind: 'meal',
  },
]

export const buildRateableTargets = (): RateableTarget[] =>
  curatedSeeds.map((seed) => ({
    ...seed,
    time: seed.time ?? '20:00',
    unlockAt: dayUnlockAt20(seed.date),
  }))

export const rateableTargets = buildRateableTargets()

export const kindLabel = (kind: RateableKind) => {
  if (kind === 'meal') return '用餐'
  if (kind === 'experience') return '体验'
  return '景点'
}

export const isTargetUnlocked = (target: RateableTarget, now: Date) =>
  now.getTime() >= new Date(target.unlockAt).getTime()

export const readRatings = (): RatingRecord[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(ratingsStorageKey) ?? '[]')
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch {
    // ignore
  }
  // 兼容旧 key，便于已有记录不丢
  try {
    const legacy = JSON.parse(localStorage.getItem('hokkaido-ratings-v1') ?? '[]')
    return Array.isArray(legacy) ? legacy : []
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
  const travelerName = input.travelerName.trim() || '本机'
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

/** 已到 20:00 开放且本机尚未评价的条目数（红点常驻直到评完） */
export const countPendingRatings = (
  ratings: RatingRecord[],
  travelerName: string,
  now: Date,
) => {
  const name = travelerName.trim() || '本机'
  return rateableTargets.filter(
    (target) => isTargetUnlocked(target, now) && !getTravelerRating(ratings, target.id, name),
  ).length
}
