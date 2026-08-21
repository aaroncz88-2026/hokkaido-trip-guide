import { type RateableTarget } from '../data/ratings'
import { tripDays, type DayPlan } from '../data/trip'
import { normalizeTravelerName } from '../data/party'

export const OPERATOR_NAME = '洋葱'
const SWAP_KEY = 'hokkaido-swap-day2-day3'

export const isOperatorName = (name: string) =>
  normalizeTravelerName(name) === OPERATOR_NAME

export const readDay23Swapped = () => {
  try {
    return localStorage.getItem(SWAP_KEY) === '1'
  } catch {
    return false
  }
}

export const writeDay23Swapped = (swapped: boolean) => {
  try {
    if (swapped) localStorage.setItem(SWAP_KEY, '1')
    else localStorage.removeItem(SWAP_KEY)
  } catch {
    // ignore private-mode / quota failures
  }
}

/** Keep calendar date / weekday / lodging; swap the trip content of DAY2 and DAY3. */
export const withDay2Day3Swap = (days: DayPlan[] = tripDays, swapped = false): DayPlan[] => {
  if (!swapped) return days
  const day2 = days.find((item) => item.day === 2)
  const day3 = days.find((item) => item.day === 3)
  if (!day2 || !day3) return days

  return days.map((item) => {
    if (item.day === 2) {
      return {
        ...day3,
        day: 2,
        date: day2.date,
        weekday: day2.weekday,
        lodging: day2.lodging,
      }
    }
    if (item.day === 3) {
      return {
        ...day2,
        day: 3,
        date: day3.date,
        weekday: day3.weekday,
        lodging: day3.lodging,
      }
    }
    return item
  })
}

/** Move DAY2/DAY3 rating cards onto the calendar day when that itinerary is actually happening. */
export const withSwappedRateableTargets = (targets: RateableTarget[], swapped = false) => {
  if (!swapped) return targets
  return targets.map((target) => {
    if (target.day !== 2 && target.day !== 3) return target
    const next =
      target.day === 2
        ? { day: 3 as const, date: '2026-08-25', weekday: '周二' }
        : { day: 2 as const, date: '2026-08-24', weekday: '周一' }
    const previous = new Date(target.unlockAt)
    const [year, month, date] = next.date.split('-').map(Number)
    const unlockAt = new Date(year, month - 1, date, previous.getHours(), previous.getMinutes(), 0, 0).toISOString()
    return { ...target, ...next, unlockAt }
  })
}
