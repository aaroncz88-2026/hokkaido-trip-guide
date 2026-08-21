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

/** 兼容旧分项字段；新版只用 overall */
export type RatingScores = Record<string, number>

export type RatingRecord = {
  targetId: string
  travelerName: string
  scores: RatingScores
  /** 笼统总分：1–10 星 */
  stars: number
  comment: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

export const MAX_STARS = 10
export const ratingsStorageKey = 'hokkaido-ratings-v4'
export const travelerStorageKey = 'hokkaido-traveler-name'

/** 当天晚上 20:00 起开放该日全部打分项 */
const dayUnlockAt20 = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 20, 0, 0, 0).toISOString()
}

type CuratedSeed = Omit<RateableTarget, 'unlockAt' | 'time'> & {
  time?: string
}

/**
 * 手工维护：不是每个景点/每顿饭都要评。
 * 笼统 1–10 星；当天 20:00 后开放该日全部项。
 */
const curatedSeeds: CuratedSeed[] = [
  {
    id: 'day1-shikotsu-lake',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '支笏湖',
    detail: '整体感受打个分就好',
    kind: 'spot',
  },
  {
    id: 'day1-dinner-genbee',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '晚餐 · 源べえ',
    detail: '这顿饭整体打个分就好',
    kind: 'meal',
  },
  {
    id: 'day2-rusutsu-park',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '留寿都游乐园',
    detail: '过山车、骑行、卡丁车等园区整体感受',
    kind: 'spot',
  },
  {
    id: 'day2-lunch',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '午餐 · Barbecue / Country House',
    detail: '园区午餐整体打个分就好',
    kind: 'meal',
  },
  {
    id: 'day2-dinner-kakashi',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '晚餐 · かかし',
    detail: '园区居酒屋整体打个分就好',
    kind: 'meal',
  },
  {
    id: 'day2-night-play',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '晚上的游乐区',
    detail: '旋转木马、光之迷宫、Game World、星尘大道',
    kind: 'experience',
  },
  {
    id: 'day3-breakfast-oktoberfest',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '早餐 · Oktoberfest',
    detail: '酒店早餐整体打个分就好',
    kind: 'meal',
  },
  {
    id: 'day3-usuzan',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '有珠山',
    detail: '缆车和展望台整体感受',
    kind: 'spot',
  },
  {
    id: 'day3-lake-hill-farm',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '下午茶 · Lake Hill Farm',
    detail: '冰淇淋和牧场轻食整体打个分就好',
    kind: 'meal',
  },
  {
    id: 'day3-toya-area',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '洞爷湖区域',
    detail: '湖畔、温泉街、烟花一带整体感受',
    kind: 'spot',
  },
  {
    id: 'day3-dinner-karzz',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '晚餐 · KARZZ',
    detail: 'Restaurant & Flowers KARZZ 整体打个分就好',
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

export const clampStars = (value: number) => {
  const n = Math.round(Number(value) || 0)
  if (n < 1 || n > MAX_STARS) return 0
  return n
}

export const isValidStars = (stars: number) => {
  const n = clampStars(stars)
  return n >= 1 && n <= MAX_STARS
}

const legacyAverage = (scores: RatingScores) => {
  const values = Object.values(scores)
    .map((n) => Number(n) || 0)
    .filter((n) => n >= 1)
  if (values.length === 0) return 0
  // 旧版 1–5 分项：换算到约 1–10 展示用；新版 overall 直接用
  if (scores.overall) return clampStars(scores.overall)
  const avg5 = values.reduce((sum, n) => sum + n, 0) / values.length
  return clampStars(Math.min(MAX_STARS, Math.round(avg5 * 2)))
}

export const isTargetUnlocked = (target: RateableTarget, now: Date) =>
  now.getTime() >= new Date(target.unlockAt).getTime()

const normalizeRecord = (raw: unknown): RatingRecord | null => {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<RatingRecord> & { stars?: number }
  if (!item.targetId || !item.travelerName) return null
  const scores =
    item.scores && typeof item.scores === 'object' ? (item.scores as RatingScores) : {}
  let stars =
    typeof item.stars === 'number' ? Math.round(item.stars) : legacyAverage(scores)
  if (stars > 0 && stars <= 5 && !scores.overall && Object.keys(scores).length > 0) {
    stars = Math.round(stars * 2)
  }
  stars = clampStars(stars)
  return {
    targetId: String(item.targetId),
    travelerName: String(item.travelerName),
    scores: stars ? { overall: stars, ...scores } : scores,
    stars,
    comment: String(item.comment ?? ''),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
    pendingSync: Boolean(item.pendingSync),
  }
}

export const readRatings = (): RatingRecord[] => {
  const keys = [ratingsStorageKey, 'hokkaido-ratings-v3', 'hokkaido-ratings-v2', 'hokkaido-ratings-v1']
  for (const key of keys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? '[]')
      if (!Array.isArray(saved) || saved.length === 0) continue
      return saved.map(normalizeRecord).filter((item): item is RatingRecord => Boolean(item))
    } catch {
      // try next
    }
  }
  return []
}

export const writeRatings = (ratings: RatingRecord[]) => {
  localStorage.setItem(ratingsStorageKey, JSON.stringify(ratings))
}

export const upsertRating = (
  ratings: RatingRecord[],
  input: {
    targetId: string
    travelerName: string
    stars: number
    comment: string
  },
): RatingRecord[] => {
  const travelerName = input.travelerName.trim() || '本机'
  const stars = clampStars(input.stars)
  const scores = { overall: stars }
  const now = new Date().toISOString()
  const existing = ratings.find(
    (item) => item.targetId === input.targetId && item.travelerName === travelerName,
  )
  if (existing) {
    return ratings.map((item) =>
      item === existing
        ? {
            ...item,
            scores,
            stars,
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
      scores,
      stars,
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
