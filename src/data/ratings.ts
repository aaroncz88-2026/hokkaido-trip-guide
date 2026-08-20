export type RateableKind = 'spot' | 'meal' | 'experience'

export type RatingDimension = {
  id: string
  label: string
}

export type RateableTarget = {
  id: string
  day: number
  date: string
  weekday: string
  time: string
  title: string
  detail: string
  kind: RateableKind
  dimensions: RatingDimension[]
  unlockAt: string
}

export type RatingScores = Record<string, number>

export type RatingRecord = {
  targetId: string
  travelerName: string
  /** 分项打分：景色/游玩/氛围 或 服务/环境/味道 */
  scores: RatingScores
  /** 三项平均，便于列表展示与旧逻辑兼容 */
  stars: number
  comment: string
  createdAt: string
  updatedAt: string
  /** Reserved for future cloud DB sync */
  pendingSync: boolean
}

export const ratingsStorageKey = 'hokkaido-ratings-v3'
export const travelerStorageKey = 'hokkaido-traveler-name'

export const spotDimensions: RatingDimension[] = [
  { id: 'scenery', label: '景色' },
  { id: 'fun', label: '游玩' },
  { id: 'vibe', label: '氛围' },
]

export const mealDimensions: RatingDimension[] = [
  { id: 'service', label: '服务' },
  { id: 'ambiance', label: '环境' },
  { id: 'taste', label: '味道' },
]

export const dimensionsForKind = (kind: RateableKind): RatingDimension[] =>
  kind === 'meal' ? mealDimensions : spotDimensions

/** 当天晚上 20:00 起开放该日全部打分项 */
const dayUnlockAt20 = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 20, 0, 0, 0).toISOString()
}

type CuratedSeed = Omit<RateableTarget, 'unlockAt' | 'time' | 'dimensions'> & {
  time?: string
  dimensions?: RatingDimension[]
}

/**
 * 手工维护：不是每个景点/每顿饭都要评。
 * DAY1：湖 + 晚饭，各含 3 个分项。
 */
const curatedSeeds: CuratedSeed[] = [
  {
    id: 'day1-shikotsu-lake',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '支笏湖',
    detail: '湖景、走走／坐船等游玩感受、整体氛围',
    kind: 'spot',
  },
  {
    id: 'day1-dinner-genbee',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '晚餐 · 源べえ',
    detail: '留寿都源べえ：服务、环境和味道',
    kind: 'meal',
  },
]

export const buildRateableTargets = (): RateableTarget[] =>
  curatedSeeds.map((seed) => ({
    ...seed,
    time: seed.time ?? '20:00',
    dimensions: seed.dimensions ?? dimensionsForKind(seed.kind),
    unlockAt: dayUnlockAt20(seed.date),
  }))

export const rateableTargets = buildRateableTargets()

export const kindLabel = (kind: RateableKind) => {
  if (kind === 'meal') return '用餐'
  if (kind === 'experience') return '体验'
  return '景点'
}

export const averageStars = (scores: RatingScores, dimensions: RatingDimension[]) => {
  const values = dimensions.map((dim) => Number(scores[dim.id]) || 0).filter((n) => n >= 1)
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10
}

export const isCompleteScores = (scores: RatingScores, dimensions: RatingDimension[]) =>
  dimensions.every((dim) => {
    const n = Number(scores[dim.id])
    return Number.isFinite(n) && n >= 1 && n <= 5
  })

export const isTargetUnlocked = (target: RateableTarget, now: Date) =>
  now.getTime() >= new Date(target.unlockAt).getTime()

const normalizeRecord = (raw: unknown): RatingRecord | null => {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<RatingRecord> & { stars?: number }
  if (!item.targetId || !item.travelerName) return null
  const scores =
    item.scores && typeof item.scores === 'object' ? (item.scores as RatingScores) : {}
  const stars = typeof item.stars === 'number' ? item.stars : averageStars(scores, spotDimensions)
  return {
    targetId: String(item.targetId),
    travelerName: String(item.travelerName),
    scores,
    stars,
    comment: String(item.comment ?? ''),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
    pendingSync: Boolean(item.pendingSync),
  }
}

export const readRatings = (): RatingRecord[] => {
  const keys = [ratingsStorageKey, 'hokkaido-ratings-v2', 'hokkaido-ratings-v1']
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
    scores: RatingScores
    stars: number
    comment: string
  },
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
            scores: input.scores,
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
      scores: input.scores,
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
