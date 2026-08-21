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
  cover: string
  unlockAt: string
}

const coverUrl = (file: string) => `${import.meta.env.BASE_URL}covers/${file}`

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

const dayUnlockAtHour = (date: string, hour: number) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, hour, 0, 0, 0).toISOString()
}

type CuratedSeed = Omit<RateableTarget, 'unlockAt' | 'time'> & {
  time?: string
  unlockAt?: string
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
    cover: coverUrl('day1-shikotsu.jpg'),
  },
  {
    id: 'day1-dinner-genbee',
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '晚餐 · 源べえ',
    detail: '这顿饭整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-genbee.jpg'),
  },
  {
    id: 'day2-rusutsu-park',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '留寿都游乐园',
    detail: '过山车、骑行、卡丁车等园区整体感受',
    kind: 'spot',
    cover: coverUrl('rating-rusutsu-park.jpg'),
  },
  {
    id: 'day2-lunch',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '午餐 · Barbecue / Country House',
    detail: '园区午餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-rusutsu-lunch.jpg'),
  },
  {
    id: 'day2-dinner-kakashi',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '晚餐 · かかし',
    detail: '园区居酒屋整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-kakashi.jpg'),
  },
  {
    id: 'day2-night-play',
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '晚上的游乐区',
    detail: '旋转木马、光之迷宫、Game World、星尘大道',
    kind: 'experience',
    cover: coverUrl('rating-rusutsu-night.jpg'),
  },
  {
    id: 'day3-breakfast-oktoberfest',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '早餐 · Oktoberfest',
    detail: '酒店早餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-oktoberfest.jpg'),
  },
  {
    id: 'day3-usuzan',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '有珠山',
    detail: '缆车和展望台整体感受',
    kind: 'spot',
    cover: coverUrl('rating-usuzan.jpg'),
  },
  {
    id: 'day3-lake-hill-farm',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '下午茶 · Lake Hill Farm',
    detail: '冰淇淋和牧场轻食整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-lake-hill-farm.jpg'),
  },
  {
    id: 'day3-toya-area',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '洞爷湖区域',
    detail: '湖畔、温泉街、烟花一带整体感受',
    kind: 'spot',
    cover: coverUrl('day3-toya.jpg'),
  },
  {
    id: 'day3-dinner-karzz',
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '晚餐 · KARZZ',
    detail: 'Restaurant & Flowers KARZZ 整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-karzz.jpg'),
  },
  {
    id: 'day4-sapporo-hotel',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '酒店 · 札幌公寓',
    detail: '入住和房间整体打个分就好',
    kind: 'experience',
    cover: coverUrl('rating-sapporo-hotel.jpg'),
  },
  {
    id: 'day4-jozankei',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '定山溪',
    detail: '温泉街、河童寻宝一带整体感受',
    kind: 'spot',
    cover: coverUrl('rating-jozankei.jpg'),
  },
  {
    id: 'day4-lunch',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '午餐 · 食堂いち',
    detail: '定山溪午餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-jozankei-lunch.jpg'),
  },
  {
    id: 'day4-shiroi-koibito',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '白色恋人公园',
    detail: '工厂、花园和巧克力整体感受',
    kind: 'spot',
    cover: coverUrl('day4-shiroi-koibito.jpg'),
  },
  {
    id: 'day4-dinner-gaja',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '晚餐 · GAjA',
    detail: 'すすきの烤肉自助整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-gaja.jpg'),
  },
  {
    id: 'day4-night-market',
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '夜市 · 狸小路',
    detail: '晚饭后逛街、夜市整体感受',
    kind: 'experience',
    cover: coverUrl('rating-tanukikoji.jpg'),
  },
  {
    id: 'day5-blue-pond',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '青池',
    detail: '水色和栈道整体感受',
    kind: 'spot',
    cover: coverUrl('rating-blue-pond.jpg'),
  },
  {
    id: 'day5-shirahige',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '白须瀑布',
    detail: '瀑布和河水整体感受',
    kind: 'spot',
    cover: coverUrl('rating-shirahige.jpg'),
  },
  {
    id: 'day5-shikisai',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '四季彩之丘',
    detail: '花田、小火车和羊驼一带整体感受',
    kind: 'spot',
    cover: coverUrl('rating-shikisai.jpg'),
  },
  {
    id: 'day5-lunch',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '午餐 · フロックスホール',
    detail: '四季彩之丘午餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-phlox-hall.jpg'),
  },
  {
    id: 'day5-tomita',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '富田农场',
    detail: '薰衣草和农场整体感受',
    kind: 'spot',
    cover: coverUrl('rating-tomita.jpg'),
  },
  {
    id: 'day5-ningle',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '精灵露台',
    detail: '小木屋和夜景整体感受',
    kind: 'spot',
    cover: coverUrl('rating-ningle.jpg'),
  },
  {
    id: 'day5-dinner-kumagera',
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '晚餐 · くまげら',
    detail: '富良野乡土料理整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-kumagera.jpg'),
  },
  {
    id: 'day6-ryugu',
    day: 6,
    date: '2026-08-28',
    weekday: '周五',
    title: '龙宫',
    detail: 'Blue Cave Cruise 出海整体感受',
    kind: 'experience',
    cover: coverUrl('rating-ryugu.jpg'),
  },
  {
    id: 'day6-lunch',
    day: 6,
    date: '2026-08-28',
    weekday: '周五',
    title: '午餐',
    detail: '小樽午餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-otaru-lunch.jpg'),
  },
  {
    id: 'day6-otaru-canal-market',
    day: 6,
    date: '2026-08-28',
    weekday: '周五',
    title: '小樽运河和市集',
    detail: '运河、仓库群和市集一带整体感受',
    kind: 'spot',
    cover: coverUrl('rating-otaru-canal.jpg'),
  },
  {
    id: 'day6-dinner',
    day: 6,
    date: '2026-08-28',
    weekday: '周五',
    title: '晚餐',
    detail: '小樽晚餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-otaru-dinner.jpg'),
  },
  {
    id: 'day7-greenland',
    day: 7,
    date: '2026-08-29',
    weekday: '周六',
    title: '游乐园',
    detail: '北海道 Greenland 整体感受',
    kind: 'spot',
    cover: coverUrl('day7-greenland.jpg'),
  },
  {
    id: 'day7-picnic',
    day: 7,
    date: '2026-08-29',
    weekday: '周六',
    title: '野餐',
    detail: '草坪野餐整体打个分就好',
    kind: 'experience',
    cover: coverUrl('rating-picnic.jpg'),
  },
  {
    id: 'day7-night-shop',
    day: 7,
    date: '2026-08-29',
    weekday: '周六',
    title: '晚上商店',
    detail: '唐吉诃德 / Nintendo POP-UP 一带整体感受',
    kind: 'experience',
    cover: coverUrl('rating-night-shop.jpg'),
  },
  {
    id: 'day7-dinner',
    day: 7,
    date: '2026-08-29',
    weekday: '周六',
    title: '晚餐',
    detail: '大地のテラス或回城晚餐整体打个分就好',
    kind: 'meal',
    cover: coverUrl('rating-day7-dinner.jpg'),
  },
  {
    id: 'day8-final',
    day: 8,
    date: '2026-08-30',
    weekday: '周日',
    title: '最后的总评',
    detail: '整趟北海道行程整体打个分',
    kind: 'experience',
    cover: coverUrl('furano-lavender-cover.jpg'),
    unlockAt: dayUnlockAtHour('2026-08-30', 8),
  },
]

export const buildRateableTargets = (): RateableTarget[] =>
  curatedSeeds.map((seed) => ({
    ...seed,
    time: seed.time ?? '20:00',
    unlockAt: seed.unlockAt ?? dayUnlockAt20(seed.date),
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
