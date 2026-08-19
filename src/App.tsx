import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  copyTextReliable,
  guideSections,
  isGoogleMapsWebUrl,
  mapsUrl,
  openMapsNavigation,
  packingTemplates,
  queryFromMapsWebUrl,
  sourceLink,
  HOME_COVER,
  tripBasics,
  tripDays,
  type DayPlan,
  type FillGuideStep,
  type TimelineItem,
  type TimelineMaterial,
} from './data/trip'
import { japaneseLessons } from './data/japanese'
import {
  dayLocationHint,
  fetchAllForecasts,
  getDayWeather,
  readWeatherCache,
  tripDateSet,
  weatherLocations,
  type LocationForecast,
} from './data/weather'
import {
  claimTravelerSeat,
  FIXED_TRAVELER_NAMES,
  formatPartyReadyLine,
  formatPartyTitle,
  isFixedTravelerName,
  PARTY_MAX,
  readClaimedTravelerName,
  readTravelerConfirmed,
  writeTravelerConfirmed,
} from './data/party'
import {
  countPendingRatings,
  getTravelerRating,
  isTargetUnlocked,
  kindLabel,
  rateableTargets,
  readRatings,
  travelerStorageKey,
  upsertRating,
  writeRatings,
  type RateableTarget,
  type RatingRecord,
} from './data/ratings'
import {
  formatSimClock,
  getAppNow,
  getCurrentActivity,
  parseDatetimeLocalValue,
  readSimOffset,
  toDatetimeLocalValue,
  TRIP_END,
  TRIP_START,
  writeSimOffset,
} from './lib/clock'
import './App.css'

type View = 'home' | 'days' | 'guide' | 'more'
type MorePanel = 'hub' | 'ratings'
type JourneyPhase = 'before' | 'during' | 'after'

/** 临时功能开关：需要时改回 true 即可恢复首页「出发前学几句」 */
const SHOW_JAPANESE_LESSON = false
/** 成团后首页不再展示对号入座；更换身份仍在「更多」 */
const SHOW_HOME_PARTY_SEAT = false

type JourneyState = {
  phase: JourneyPhase
  value: string
  label: string
  day: number | null
}
type SearchResult = {
  key: string
  kicker: string
  title: string
  dayNumber: number
  target: 'days' | 'guide' | 'more'
}
type PackingItem = {
  id: string
  text: string
  checked: boolean
}
type PackingList = {
  id: string
  title: string
  templateId?: string
  items: PackingItem[]
}

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const createDefaultPackingLists = (): PackingList[] => {
  let legacyChecklist: Record<string, boolean> = {}
  try {
    legacyChecklist = JSON.parse(localStorage.getItem('hokkaido-checklist') ?? '{}')
  } catch {
    legacyChecklist = {}
  }

  return packingTemplates.map((list) => ({
    id: list.id,
    title: list.title,
    templateId: list.id,
    items: list.items.map((text, index) => ({
      id: `${list.id}-${index}`,
      text,
      checked: Boolean(legacyChecklist[text]),
    })),
  }))
}

const iconPaths: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  guide: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  arrow: 'm9 18 6-6-6-6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2',
  check: 'm5 12 4 4L19 6',
  search: 'm21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  external: 'M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6',
  suitcase: 'M9 6V4h6v2M4 7h16v13H4V7Zm0 5h16M9 12v2m6-2v2',
  weather: 'M12 3v2M5.6 5.6l1.4 1.4M3 12h2m2.2 5-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm5.4 2.6A4.5 4.5 0 0 0 21 15.5 4.5 4.5 0 0 0 14.2 12',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-10h.01',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01',
  volume: 'M11 5 6 9H3v6h3l5 4V5Zm4.5 4a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12',
  star: 'm12 3 2.7 5.5L21 9.3l-4.5 4.4L17.6 21 12 18.1 6.4 21l1.1-7.3L3 9.3l6.3-.8L12 3Z',
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d={iconPaths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

const formatDate = (date: string) => {
  const [, month, day] = date.split('-').map(Number)
  return `${month}月${day}日`
}

const MapsLink = ({
  query,
  children,
  className,
}: {
  query: string
  children: ReactNode
  className?: string
}) => {
  const [tip, setTip] = useState('')

  return (
    <>
      <a
        className={className}
        href={mapsUrl(query)}
        rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault()
          const mode = openMapsNavigation(query)
          if (mode === 'wechat') {
            setTip(
              '地名已复制。微信里谷歌地图常打不开：已尝试唤起系统地图；若仍无反应，点右上角 ··· → 在浏览器打开后再点导航，或去地图 App 粘贴地名。',
            )
            window.setTimeout(() => setTip(''), 5200)
          }
        }}
      >
        {children}
      </a>
      {tip && (
        <div className="maps-toast" role="status">
          {tip}
        </div>
      )}
    </>
  )
}

const CopyPlaceButton = ({ query }: { query: string }) => {
  const [hint, setHint] = useState('')
  return (
    <button
      className="copy-place"
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const ok = copyTextReliable(query)
        setHint(ok ? '已复制' : '复制失败，请长按地名')
        window.setTimeout(() => setHint(''), 1600)
      }}
    >
      {hint || '复制地名'}
    </button>
  )
}

const ExternalOrMapsLink = ({
  url,
  label,
  className,
}: {
  url: string
  label: string
  className?: string
}) => {
  if (isGoogleMapsWebUrl(url)) {
    const query = queryFromMapsWebUrl(url)
    if (query) {
      return (
        <MapsLink className={className} query={query}>
          <Icon name="map" size={15} /> {label}
        </MapsLink>
      )
    }
  }
  return (
    <a className={className} href={url} rel="noopener noreferrer" target="_blank">
      <Icon name={/\.pdf($|\?)/i.test(url) ? 'guide' : 'external'} size={15} /> {label}
    </a>
  )
}

/** 已挂在门牌选项旁的链接，不再在时段底部重复展示 */
const leftoverItemLinks = (item: TimelineItem) => {
  const attached = new Set(
    item.materials
      .flatMap((material) => material.steps ?? [])
      .flatMap((step) => step.links ?? [])
      .map((link) => link.url),
  )
  return item.links.filter((link) => !attached.has(link.url))
}

function PinnedDocDots({ docs }: { docs?: { label: string; url: string }[] }) {
  if (!docs?.length) return null
  return (
    <>
      {docs.map((doc) => (
        <a
          className="highlight-row__doc"
          href={doc.url}
          key={doc.url}
          rel="noopener noreferrer"
          target="_blank"
          title={doc.label}
        >
          <Icon name="guide" size={12} />
          {/发言稿/.test(doc.label) ? '发言稿' : doc.label.replace(/^DAY\s*\d+\s*/i, '')}
        </a>
      ))}
    </>
  )
}

const getJourneyState = (now: Date): JourneyState => {
  if (now > TRIP_END) {
    return {
      phase: 'after',
      value: '2026.08.23 — 08.30',
      label: '两家人的北海道旅行 · 珍藏回忆',
      day: null,
    }
  }
  if (now >= TRIP_START) {
    const day = Math.min(8, Math.floor((now.getTime() - TRIP_START.getTime()) / 86_400_000) + 1)
    return {
      phase: 'during',
      value: `DAY ${day}`,
      label: `旅行第 ${day} 天 · ${tripDays[day - 1].title}`,
      day,
    }
  }
  const days = Math.ceil((TRIP_START.getTime() - now.getTime()) / 86_400_000)
  return { phase: 'before', value: `${days}`, label: '天后出发', day: null }
}

let japaneseAudio: HTMLAudioElement | null = null

const pickFemaleJapaneseVoice = () => {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const japanese = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ja'))
  return (
    japanese.find((voice) => /kyoko|nanami|haruka|sayaka|female|女/i.test(`${voice.name} ${voice.voiceURI}`)) ||
    japanese.find((voice) => !/otoya|ichiro|male|男/i.test(`${voice.name} ${voice.voiceURI}`)) ||
    japanese[0] ||
    null
  )
}

const speakWithSystemVoice = (text: string) => {
  if (!('speechSynthesis' in window)) return false
  const speech = new SpeechSynthesisUtterance(text)
  speech.lang = 'ja-JP'
  speech.rate = 0.82
  speech.pitch = 1.08
  const femaleVoice = pickFemaleJapaneseVoice()
  if (femaleVoice) speech.voice = femaleVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(speech)
  return true
}

const speakJapanese = (text: string, onStart?: () => void, onEnd?: () => void) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12)
    } catch {
      // ignore unsupported vibration
    }
  }

  if (japaneseAudio) {
    japaneseAudio.pause()
    japaneseAudio = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()

  const sources = [
    `https://dict.youdao.com/dictvoice?le=jap&audio=${encodeURIComponent(text)}`,
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=ja&q=${encodeURIComponent(text)}`,
  ]

  const tryPlay = (index: number) => {
    if (index >= sources.length) {
      const started = speakWithSystemVoice(text)
      if (started) onStart?.()
      window.setTimeout(() => onEnd?.(), Math.min(4200, 900 + text.length * 180))
      return
    }

    const audio = new Audio(sources[index])
    japaneseAudio = audio
    audio.onplay = () => onStart?.()
    audio.onended = () => {
      if (japaneseAudio === audio) japaneseAudio = null
      onEnd?.()
    }
    audio.onerror = () => {
      if (japaneseAudio === audio) japaneseAudio = null
      tryPlay(index + 1)
    }
    void audio.play().catch(() => {
      if (japaneseAudio === audio) japaneseAudio = null
      tryPlay(index + 1)
    })
  }

  tryPlay(0)
}

function DayCard({ day, onOpen }: { day: DayPlan; onOpen: () => void }) {
  return (
    <button
      className="day-card"
      onClick={onOpen}
      style={{ '--day-accent': day.accent, backgroundImage: `url(${day.cover})` } as CSSProperties}
    >
      <span className="day-card__index">DAY {day.day}</span>
      <span className="day-card__date">{formatDate(day.date)} · {day.weekday}</span>
      <strong>{day.title}</strong>
      <span className="day-card__route">{day.route}</span>
      <span className="day-card__cta">查看行程 <Icon name="arrow" size={16} /></span>
    </button>
  )
}

function CopyPhraseButton({ text }: { text: string }) {
  const [hint, setHint] = useState('')
  return (
    <button
      className="copy-phrase"
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const ok = copyTextReliable(text)
        setHint(ok ? '已复制' : '复制失败，请长按')
        window.setTimeout(() => setHint(''), 1600)
      }}
    >
      {hint || '复制日文'}
    </button>
  )
}

function MaterialSteps({
  material,
  itemId,
  fillChecks,
  onToggleFill,
}: {
  material: TimelineMaterial
  itemId: string
  fillChecks: Record<string, boolean>
  onToggleFill: (key: string) => void
}) {
  const steps = material.steps ?? []
  if (steps.length === 0) return null

  const options = steps.filter((step) => step.kind === 'option')
  const phrases = steps.filter((step) => step.kind === 'phrase')
  const tasks = steps.filter((step) => step.kind !== 'option' && step.kind !== 'phrase')

  const renderTask = (step: FillGuideStep) => {
    const key = `${itemId}:${step.id}`
    return (
      <label className={fillChecks[key] ? 'fill-guide__step done' : 'fill-guide__step'} key={step.id}>
        <input
          checked={Boolean(fillChecks[key])}
          type="checkbox"
          onChange={() => onToggleFill(key)}
        />
        <span>
          <strong>{step.field}</strong>
          <small>{step.how}</small>
        </span>
      </label>
    )
  }

  const doorLabel = (field: string, index: number) => {
    const matched = field.match(/^(\d+)\s*(.*)$/)
    if (matched) return { n: matched[1], name: matched[2] || field }
    return { n: String(index + 1), name: field }
  }

  return (
    <>
      {tasks.length > 0 && (
        <div className="fill-guide">
          <span className="eyebrow">{phrases.length > 0 || options.length > 0 ? '家长帮忙 · 可勾选' : '必要问询任务'}</span>
          {tasks.map(renderTask)}
        </div>
      )}
      {options.length > 0 && (
        <div className="fill-options">
          <span className="eyebrow">门牌</span>
          {options.map((step, index) => {
            const door = doorLabel(step.field, index)
            return (
              <div className="fill-options__item" key={step.id}>
                <em className="fill-options__n" aria-hidden="true">{door.n}</em>
                <span>
                  <strong>{door.name}</strong>
                  <small>{step.how}</small>
                  {step.links && step.links.length > 0 && (
                    <div className="fill-options__links">
                      {step.links.map((link) => (
                        <ExternalOrMapsLink
                          className="fill-options__link"
                          key={link.url}
                          label={link.label}
                          url={link.url}
                        />
                      ))}
                    </div>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {phrases.length > 0 && (
        <div className="fill-phrases">
          <span className="eyebrow">现场话术 · 可复制</span>
          {phrases.map((step, index) => (
            <div className="fill-phrases__item" key={step.id}>
              <div className="fill-phrases__head">
                <em className="fill-options__n" aria-hidden="true">{index + 1}</em>
                <CopyPhraseButton text={step.field} />
              </div>
              <p className="fill-phrases__jp" lang="ja">
                {step.field}
              </p>
              <small className="fill-phrases__zh">{step.how}</small>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ParkingBar({ day }: { day: DayPlan }) {
  return (
    <section className="day-parking" aria-label="当天导航">
      <div className="day-parking__head">
        <span>DAY {day.day} · 当天导航</span>
        <small>停车 / 吃饭 / 便利店 · 仅司机导航</small>
      </div>
      <ul className="parking-stop-list">
        {day.navigation.map((item, index) => (
          <li className="parking-stop" key={`${day.day}-${item.label}`}>
            <MapsLink className="parking-stop__nav" query={item.query}>
              <em className="parking-stop__n">{index + 1}</em>
              <span className="parking-stop__text">
                <strong>{item.label}</strong>
                {item.query !== item.label && <small>{item.query}</small>}
              </span>
              <span className="parking-stop__go">
                导航 <Icon name="external" size={13} />
              </span>
            </MapsLink>
            <CopyPlaceButton query={item.query} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TimelineCard({
  item,
  checked,
  onToggle,
  fillChecks,
  onToggleFill,
}: {
  item: TimelineItem
  checked: boolean
  onToggle: () => void
  fillChecks: Record<string, boolean>
  onToggleFill: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(
    item.dad || item.mom || item.kids || item.links.length || item.materials.length || item.costJpy,
  )

  return (
    <article className={`timeline-card ${checked ? 'timeline-card--done' : ''}`} id={`timeline-${item.id}`}>
      <button
        aria-label={checked ? '标记为未完成' : '标记为已完成'}
        className="timeline-check"
        onClick={onToggle}
      >
        {checked && <Icon name="check" size={15} />}
      </button>
      <div className="timeline-time">{item.time}</div>
      <div className="timeline-body">
        <h3>{item.title}</h3>
        {item.tags.length > 0 && (
          <div className="tag-row">
            {item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        )}
        {item.detail !== `【${item.tags[0]}】` && <p>{item.detail}</p>}
        {item.materials.length > 0 && (
          <div className="material-preview">
            {item.materials.map((material) => (
              <span key={material.title}>含{material.title}</span>
            ))}
          </div>
        )}
        {hasDetails && (
          <button className="text-button" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起细节' : item.materials.length ? '查看填写攻略与分工' : '分工与资料'}
            <span className={expanded ? 'chevron chevron--up' : 'chevron'}><Icon name="arrow" size={15} /></span>
          </button>
        )}
        {expanded && (
          <div className="timeline-details">
            {item.materials.map((material) => (
              <div className="timeline-material" key={material.title}>
                <span>资料</span>
                <strong>{material.title}</strong>
                <p>{material.body}</p>
                <MaterialSteps
                  fillChecks={fillChecks}
                  itemId={item.id}
                  material={material}
                  onToggleFill={onToggleFill}
                />
              </div>
            ))}
            {item.dad && <div><span>爸爸</span><p>{item.dad}</p></div>}
            {item.mom && <div><span>妈妈</span><p>{item.mom}</p></div>}
            {item.kids && <div><span>孩子</span><p>{item.kids}</p></div>}
            {(item.costJpy || item.costCny) && (
              <div><span>费用</span><p>{item.costJpy && `¥${item.costJpy}`}{item.costCny && ` · 约 ¥${item.costCny} CNY`}</p></div>
            )}
            {leftoverItemLinks(item).map((link) => (
              <ExternalOrMapsLink key={link.url} label={link.label} url={link.url} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function App() {
  const [view, setView] = useState<View>('home')
  const [selectedDay, setSelectedDay] = useState(1)
  const [simOffsetMs, setSimOffsetMs] = useState<number | null>(() => readSimOffset())
  const [clockTick, setClockTick] = useState(0)
  const [simDraft, setSimDraft] = useState(() => toDatetimeLocalValue(getAppNow(readSimOffset())))
  const [simMessage, setSimMessage] = useState('')
  const [timePanelOpen, setTimePanelOpen] = useState(false)
  const [timeDraftDay, setTimeDraftDay] = useState(1)
  const [fillChecks, setFillChecks] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('hokkaido-fill-checks') ?? '{}')
    } catch {
      return {}
    }
  })
  const [showRest, setShowRest] = useState(false)
  const [search, setSearch] = useState('')
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('hokkaido-completed') ?? '{}')
    } catch {
      return {}
    }
  })
  const [packingLists, setPackingLists] = useState<PackingList[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hokkaido-packing-lists-v2') ?? 'null')
      return Array.isArray(saved) ? saved : createDefaultPackingLists()
    } catch {
      return createDefaultPackingLists()
    }
  })
  const [travelerName, setTravelerName] = useState(() => readClaimedTravelerName())
  const [travelerConfirmed, setTravelerConfirmed] = useState(() => {
    const claimed = readClaimedTravelerName()
    return Boolean(claimed) && readTravelerConfirmed()
  })
  const [partyBusy, setPartyBusy] = useState(false)
  const [partyMessage, setPartyMessage] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<null | { mode: 'join' | 'rename'; name: string }>(
    null,
  )
  const [packingOwner, setPackingOwner] = useState(() => localStorage.getItem('hokkaido-packing-owner') ?? '')
  const [showPacked, setShowPacked] = useState(() => localStorage.getItem('hokkaido-show-packed') !== 'false')
  const [newListName, setNewListName] = useState('')
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [activePackingListId, setActivePackingListId] = useState('')
  const [japaneseLessonIndex, setJapaneseLessonIndex] = useState(0)
  const [revealedPhrases, setRevealedPhrases] = useState<Record<string, boolean>>({})
  const [speakingPhraseKey, setSpeakingPhraseKey] = useState<string | null>(null)
  const [morePanel, setMorePanel] = useState<MorePanel>('hub')
  const [ratings, setRatings] = useState<RatingRecord[]>(() => readRatings())
  const [ratingDraftStars, setRatingDraftStars] = useState<Record<string, number>>({})
  const [ratingDraftComments, setRatingDraftComments] = useState<Record<string, string>>({})
  const [ratingFilter, setRatingFilter] = useState<'open' | 'locked' | 'done'>('open')
  const [ratingMessage, setRatingMessage] = useState('')
  const [weatherForecasts, setWeatherForecasts] = useState<LocationForecast[]>(() => readWeatherCache())
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'ready' | 'error'>(
    () => (readWeatherCache().length > 0 ? 'ready' : 'loading'),
  )
  const [weatherError, setWeatherError] = useState('')
  const [weatherNote, setWeatherNote] = useState('')
  const [weatherLocationId, setWeatherLocationId] = useState('sapporo')
  const [weatherDate, setWeatherDate] = useState('2026-08-23')
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState('')

  useEffect(() => {
    localStorage.setItem('hokkaido-completed', JSON.stringify(completed))
  }, [completed])

  useEffect(() => {
    localStorage.setItem('hokkaido-packing-lists-v2', JSON.stringify(packingLists))
  }, [packingLists])

  useEffect(() => {
    if (!travelerConfirmed || !isFixedTravelerName(travelerName)) return
    localStorage.setItem(travelerStorageKey, travelerName)
    writeTravelerConfirmed(true)
    if (travelerName.trim() && !packingOwner.trim()) {
      setPackingOwner(travelerName.trim())
    }
  }, [travelerName, packingOwner, travelerConfirmed])

  useEffect(() => {
    localStorage.setItem('hokkaido-packing-owner', packingOwner)
  }, [packingOwner])

  useEffect(() => {
    writeRatings(ratings)
  }, [ratings])

  useEffect(() => {
    localStorage.setItem('hokkaido-show-packed', String(showPacked))
  }, [showPacked])

  useEffect(() => {
    localStorage.setItem('hokkaido-fill-checks', JSON.stringify(fillChecks))
  }, [fillChecks])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.getVoices()
    const refreshVoices = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadWeather = async (silent = false) => {
      if (!silent) setWeatherStatus((status) => (weatherForecasts.length > 0 ? status : 'loading'))
      setWeatherError('')
      try {
        const result = await fetchAllForecasts()
        if (cancelled) return
        setWeatherForecasts(result.forecasts)
        setWeatherUpdatedAt(new Date().toISOString())
        setWeatherStatus('ready')
        setWeatherNote(
          result.fromCache
            ? '正在用上次缓存，网络恢复后会自动更新。'
            : result.partial
              ? '部分地点刷新成功，其余地点稍后再试。'
              : '',
        )
      } catch (error) {
        if (cancelled) return
        if (weatherForecasts.length > 0) {
          setWeatherStatus('ready')
          setWeatherNote(error instanceof Error ? error.message : '天气暂时刷不出，先看缓存')
          return
        }
        setWeatherStatus('error')
        setWeatherError(error instanceof Error ? error.message : '天气数据暂时不可用')
      }
    }
    const start = window.setTimeout(() => void loadWeather(), 400)
    const timer = window.setInterval(() => void loadWeather(true), 30 * 60_000)
    return () => {
      cancelled = true
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((tick) => tick + 1), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const now = useMemo(() => {
    void clockTick
    return getAppNow(simOffsetMs)
  }, [simOffsetMs, clockTick])
  const isSimulating = simOffsetMs != null
  const currentDay = tripDays.find((day) => day.day === selectedDay) ?? tripDays[0]
  const journey = getJourneyState(now)
  /** 8 月 23 日行程日起关闭行李清单，底栏改天气预报 */
  const packingClosed = now >= TRIP_START
  const resolveLiveDayNumber = () => {
    if (journey.day) return journey.day
    if (now >= TRIP_START && now <= TRIP_END) {
      return Math.min(8, Math.floor((now.getTime() - TRIP_START.getTime()) / 86_400_000) + 1)
    }
    return null
  }
  const syncViewsToLiveDay = () => {
    const dayNum = resolveLiveDayNumber()
    if (!dayNum) return null
    const day = tripDays[dayNum - 1]
    if (!day) return null
    setSelectedDay(dayNum)
    setWeatherDate(day.date)
    setWeatherLocationId(dayLocationHint[dayNum] ?? 'sapporo')
    return day
  }
  const scrollToLiveTimeline = () => {
    window.setTimeout(() => {
      const activity = getCurrentActivity(getAppNow(simOffsetMs))
      if (!activity) return
      document
        .getElementById(`timeline-${activity.item.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }
  const openWeatherDesk = (locationId?: string, date?: string) => {
    const live = syncViewsToLiveDay()
    if (locationId) setWeatherLocationId(locationId)
    else if (!live) setWeatherLocationId('sapporo')
    if (date) setWeatherDate(date)
    else if (!live) setWeatherDate('2026-08-23')
    setMorePanel('hub')
    setView(packingClosed ? 'guide' : 'more')
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const currentActivity = useMemo(() => getCurrentActivity(now), [now])
  const visibleTimeline = currentDay.timeline.filter((item) => showRest || !item.isRest)
  const totalPackingItems = packingLists.reduce((total, list) => total + list.items.length, 0)
  const packedItems = packingLists.reduce(
    (total, list) => total + list.items.filter((item) => item.checked).length,
    0,
  )
  const activePackingList =
    packingLists.find((list) => list.id === activePackingListId) ?? packingLists[0]
  const selectedWeatherForecast =
    weatherForecasts.find((item) => item.location.id === weatherLocationId) ?? weatherForecasts[0]
  const selectedWeatherDay = selectedWeatherForecast?.daily.find((day) => day.date === weatherDate)
  const selectedHourly = selectedWeatherForecast?.hourlyByDate[weatherDate] ?? []
  const tripWeatherStrip = useMemo(() => {
    return tripDays.map((day) => ({
      day,
      weather: getDayWeather(weatherForecasts, day.date, dayLocationHint[day.day]),
    }))
  }, [weatherForecasts])
  const homeWeather =
    journey.phase === 'during' && journey.day
      ? getDayWeather(weatherForecasts, tripDays[journey.day - 1]?.date ?? '', dayLocationHint[journey.day])
      : getDayWeather(weatherForecasts, '2026-08-23', 'sapporo')
  const currentDayWeather = getDayWeather(
    weatherForecasts,
    currentDay.date,
    dayLocationHint[currentDay.day],
  )
  const weatherSourceLabel = selectedWeatherForecast?.source
    ? `数据源 ${selectedWeatherForecast.source}`
    : ''
  const japaneseLesson = japaneseLessons[japaneseLessonIndex]
  const isPartyMember = travelerConfirmed && isFixedTravelerName(travelerName)
  const pendingRatingCount = useMemo(
    () => (isPartyMember ? countPendingRatings(ratings, travelerName, now) : 0),
    [isPartyMember, now, ratings, travelerName],
  )
  const ratingBuckets = useMemo(() => {
    const name = travelerName.trim()
    const open: RateableTarget[] = []
    const locked: RateableTarget[] = []
    const done: RateableTarget[] = []
    for (const target of rateableTargets) {
      const unlocked = isTargetUnlocked(target, now)
      const existing = name ? getTravelerRating(ratings, target.id, name) : undefined
      if (!unlocked) locked.push(target)
      else if (existing) done.push(target)
      else open.push(target)
    }
    return { open, locked, done }
  }, [now, ratings, travelerName])
  const searchResults = useMemo<SearchResult[]>(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return []
    const dayMatches = tripDays
      .filter((day) =>
        [day.title, day.route, day.summary, ...day.highlights, ...day.reminders]
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      )
      .map((day) => ({
        key: `day-${day.day}`,
        kicker: `DAY ${day.day} · ${formatDate(day.date)}`,
        title: day.title,
        dayNumber: day.day,
        target: 'days' as const,
      }))
    const timelineMatches = tripDays.flatMap((day) =>
      day.timeline
        .filter((item) =>
          [item.title, item.detail, item.dad, item.mom, item.kids]
            .join(' ')
            .toLowerCase()
            .includes(keyword),
        )
        .map((item) => ({
          key: item.id,
          kicker: `DAY ${day.day} · ${item.time}`,
          title: item.title,
          dayNumber: day.day,
          target: 'days' as const,
        })),
    )
    const guideMatches: SearchResult[] = guideSections.flatMap((section) =>
      section.items
        .filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(keyword))
        .map((item) => ({
          key: `${section.id}-${item.title}`,
          kicker: section.title,
          title: item.title,
          dayNumber: 0,
          target: 'more' as const,
        })),
    )
    const packingMatches: SearchResult[] = packingClosed
      ? []
      : packingTemplates.flatMap((section) =>
          section.items
            .filter((item) => item.toLowerCase().includes(keyword))
            .map((item) => ({
              key: `${section.id}-${item}`,
              kicker: section.title,
              title: item,
              dayNumber: 0,
              target: 'guide' as const,
            })),
        )
    return [...dayMatches, ...timelineMatches, ...guideMatches, ...packingMatches].slice(0, 20)
  }, [search, packingClosed])

  const openDay = (day: number) => {
    setSelectedDay(day)
    setView('days')
    setSearch('')
    setMorePanel('hub')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openRatingsPanel = () => {
    const name = travelerName.trim()
    if (name) {
      const stars: Record<string, number> = {}
      const comments: Record<string, string> = {}
      for (const record of ratings) {
        if (record.travelerName === name) {
          stars[record.targetId] = record.stars
          comments[record.targetId] = record.comment
        }
      }
      setRatingDraftStars((prev) => ({ ...stars, ...prev }))
      setRatingDraftComments((prev) => ({ ...comments, ...prev }))
    }
    setRatingFilter('open')
    setRatingMessage('')
    setMorePanel('ratings')
    setView('more')
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const requestClaimSeat = (name: string, mode: 'join' | 'rename' = 'join') => {
    if (!isFixedTravelerName(name)) {
      setPartyMessage('请从四人名单里选择')
      return
    }
    if (mode === 'rename' && name === travelerName) {
      setPartyMessage('你已经是这个身份了')
      return
    }
    setPartyMessage('')
    setConfirmDialog({ mode, name })
  }

  const confirmPartyAction = () => {
    if (!confirmDialog) return
    setPartyBusy(true)
    setPartyMessage('')
    const result = claimTravelerSeat(confirmDialog.name)
    setPartyBusy(false)
    if (!result.ok) {
      setPartyMessage(result.message)
      setConfirmDialog(null)
      return
    }
    setTravelerName(confirmDialog.name)
    setTravelerConfirmed(true)
    if (!packingOwner.trim()) setPackingOwner(confirmDialog.name)
    setPartyMessage(
      confirmDialog.mode === 'join'
        ? `欢迎，${confirmDialog.name}！对号入座成功。之后如需更换，请到「更多」。`
        : `已切换为「${confirmDialog.name}」`,
    )
    setConfirmDialog(null)
  }

  const saveRating = (target: RateableTarget) => {
    const name = travelerName.trim()
    if (!name || !isPartyMember) {
      setRatingMessage('请先在首页确认加入旅行名单')
      return
    }
    if (!isTargetUnlocked(target, now)) {
      setRatingMessage('还没到开放时间，玩完再来打分哦')
      return
    }
    const existing = getTravelerRating(ratings, target.id, name)
    const stars = ratingDraftStars[target.id] ?? existing?.stars ?? 0
    if (stars < 1 || stars > 5) {
      setRatingMessage('请先点选 1–5 颗星')
      return
    }
    const comment = ratingDraftComments[target.id] ?? existing?.comment ?? ''
    setRatings((prev) =>
      upsertRating(prev, {
        targetId: target.id,
        travelerName: name,
        stars,
        comment,
      }),
    )
    setRatingMessage('已保存到本机，后续可同步到后台数据库')
  }

  const ratingPrompt = (target: RateableTarget, index: number) => {
    const name = travelerName.trim() || '旅行者'
    const kind = kindLabel(target.kind)
    return `${name}，你评价下这个${index === 0 ? '第一个' : ''}${kind}吧：${target.title}`
  }

  const renderStarPicker = (
    targetId: string,
    value: number,
    disabled = false,
  ) => (
    <div className="star-picker" role="radiogroup" aria-label="星级评分">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          aria-checked={value === star}
          className={star <= value ? 'active' : ''}
          disabled={disabled}
          key={star}
          onClick={() => {
            setRatingDraftStars((prev) => ({ ...prev, [targetId]: star }))
            setRatingMessage('')
          }}
          role="radio"
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  )

  const renderRatingCard = (target: RateableTarget, index: number, mode: 'open' | 'locked' | 'done') => {
    const name = travelerName.trim()
    const existing = name ? getTravelerRating(ratings, target.id, name) : undefined
    const stars = ratingDraftStars[target.id] ?? existing?.stars ?? 0
    const comment = ratingDraftComments[target.id] ?? existing?.comment ?? ''
    const unlockLabel = new Date(target.unlockAt).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    return (
      <article className={`rating-card rating-card--${mode}`} key={target.id}>
        <header>
          <div>
            <span>
              DAY {target.day} · {kindLabel(target.kind)} · {target.time}
            </span>
            <h3>{target.title}</h3>
          </div>
          <em>{mode === 'locked' ? '未开放' : mode === 'done' ? `${existing?.stars ?? stars}★` : '待评价'}</em>
        </header>
        <p className="rating-prompt">{ratingPrompt(target, index)}</p>
        {mode === 'locked' ? (
          <p className="rating-lock-note">行程时段结束后开放 · 预计 {unlockLabel}</p>
        ) : (
          <>
            {renderStarPicker(target.id, stars, false)}
            <label className="rating-comment">
              <span>评语（可选）</span>
              <textarea
                maxLength={200}
                onChange={(event) =>
                  setRatingDraftComments((prev) => ({
                    ...prev,
                    [target.id]: event.target.value,
                  }))
                }
                placeholder="写下这一刻的感受…"
                rows={2}
                value={comment}
              />
            </label>
            <button className="rating-save" onClick={() => saveRating(target)} type="button">
              {existing ? '更新评分' : '提交评分'}
            </button>
          </>
        )}
      </article>
    )
  }

  const togglePackingItem = (listId: string, itemId: string) => {
    setPackingLists((lists) =>
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            }
          : list,
      ),
    )
  }

  const deletePackingItem = (listId: string, itemId: string) => {
    setPackingLists((lists) =>
      lists.map((list) =>
        list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list,
      ),
    )
  }

  const deletePackingList = (listId: string, title: string) => {
    if (!window.confirm(`确定删除“${title}”整组清单吗？`)) return
    setPackingLists((lists) => lists.filter((list) => list.id !== listId))
    if (activePackingListId === listId) setActivePackingListId('')
  }

  const addPackingItem = (event: FormEvent, listId: string) => {
    event.preventDefault()
    const text = newItemText[listId]?.trim()
    if (!text) return
    setPackingLists((lists) =>
      lists.map((list) =>
        list.id === listId
          ? { ...list, items: [...list.items, { id: createId('item'), text, checked: false }] }
          : list,
      ),
    )
    setNewItemText((values) => ({ ...values, [listId]: '' }))
  }

  const addPackingList = (event: FormEvent) => {
    event.preventDefault()
    const title = newListName.trim()
    if (!title) return
    const id = createId('list')
    setPackingLists((lists) => [...lists, { id, title, items: [] }])
    setActivePackingListId(id)
    setNewListName('')
  }

  const addPackingTemplate = (event: FormEvent) => {
    event.preventDefault()
    const template = packingTemplates.find((item) => item.id === templateToAdd)
    if (!template) return
    const id = createId(template.id)
    setPackingLists((lists) => [
      ...lists,
      {
        id,
        title: template.title,
        templateId: template.id,
        items: template.items.map((text, index) => ({
          id: createId(`${template.id}-${index}`),
          text,
          checked: false,
        })),
      },
    ])
    setActivePackingListId(id)
    setTemplateToAdd('')
  }

  const TIME_HOUR_PRESETS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20] as const

  const openTimePanel = () => {
    setSimDraft(toDatetimeLocalValue(now))
    const dayFromNow =
      now >= TRIP_START && now <= TRIP_END
        ? Math.min(8, Math.floor((now.getTime() - TRIP_START.getTime()) / 86_400_000) + 1)
        : selectedDay
    setTimeDraftDay(dayFromNow)
    setSimMessage('')
    setTimePanelOpen(true)
  }

  const applySimulatedTime = (target: Date, message?: string) => {
    const offset = target.getTime() - Date.now()
    writeSimOffset(offset)
    setSimOffsetMs(offset)
    setSimDraft(toDatetimeLocalValue(target))
    setClockTick((tick) => tick + 1)
    setSimMessage(message ?? `已切换到 ${formatSimClock(target)}`)
    if (target >= TRIP_START && target <= TRIP_END) {
      const day = Math.min(8, Math.floor((target.getTime() - TRIP_START.getTime()) / 86_400_000) + 1)
      setSelectedDay(day)
      setTimeDraftDay(day)
      const plan = tripDays[day - 1]
      if (plan) {
        setWeatherDate(plan.date)
        setWeatherLocationId(dayLocationHint[day] ?? 'sapporo')
      }
    }
  }

  const runSimulation = (event?: FormEvent) => {
    event?.preventDefault()
    const target = parseDatetimeLocalValue(simDraft)
    if (!target) {
      setSimMessage('请选择有效的日期和时间')
      return
    }
    applySimulatedTime(target)
    setTimePanelOpen(false)
  }

  const returnToRealTime = () => {
    writeSimOffset(null)
    setSimOffsetMs(null)
    const realNow = new Date()
    setSimDraft(toDatetimeLocalValue(realNow))
    setClockTick((tick) => tick + 1)
    setSimMessage('已回到真实当前时间')
  }

  const buildDayAtHour = (dayNumber: number, hour: number, minute = 0) => {
    const day = tripDays.find((item) => item.day === dayNumber)
    if (!day) return null
    const [year, month, date] = day.date.split('-').map(Number)
    return new Date(year, month - 1, date, hour, minute, 0, 0)
  }

  const applyHourPreset = (hour: number) => {
    const preset = buildDayAtHour(timeDraftDay, hour)
    if (!preset) return
    applySimulatedTime(preset, `已模拟 DAY ${timeDraftDay} · ${String(hour).padStart(2, '0')}:00`)
    setTimePanelOpen(false)
  }

  const nudgeSim = (deltaMs: number) => {
    applySimulatedTime(new Date(now.getTime() + deltaMs))
  }

  const repairAppCache = async () => {
    try {
      localStorage.removeItem('hokkaido-sw-recovery-v17')
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((registration) => registration.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
    } catch {
      // ignore
    }
    window.location.href = `${import.meta.env.BASE_URL}?repair=${Date.now()}`
  }

  const toggleFillStep = (key: string) => {
    setFillChecks((values) => ({ ...values, [key]: !values[key] }))
  }

  const renderNowCard = () => {
    if (!currentActivity) {
      return (
        <section className="now-card now-card--empty">
          <span className="eyebrow">NOW · DAY {journey.day}</span>
          <h2>当前时段暂无具体安排</h2>
          <p>可以切换到行程页查看全天时间轴，或点顶部「调时间」跳到具体时段。</p>
        </section>
      )
    }

    const item = currentActivity.item
    const extraLinks = leftoverItemLinks(item)
    return (
      <section className="now-card">
        <div className="now-card__head">
          <span className="eyebrow">当前行动 · DAY {currentActivity.day.day}</span>
          <strong>{item.time}</strong>
        </div>
        <h2>{item.title}</h2>
        <p>{item.detail}</p>

        <div className="now-card__tasks">
          <span className="eyebrow">家庭分工</span>
          <div><em>爸爸</em><p>{item.dad || '本时段无额外任务'}</p></div>
          <div><em>妈妈</em><p>{item.mom || '本时段无额外任务'}</p></div>
          <div><em>孩子</em><p>{item.kids || '本时段无额外任务'}</p></div>
        </div>

        {item.materials.map((material) => {
          const hasOptions = material.steps?.some((step) => step.kind === 'option')
          const hasPhrases = material.steps?.some((step) => step.kind === 'phrase')
          const hasTasks = material.steps?.some((step) => !step.kind || step.kind === 'task')
          const eyebrow =
            hasPhrases && hasTasks
              ? '家长任务 · 可复制话术'
              : hasOptions && hasTasks
                ? '晚饭备选 · 必要任务'
                : hasPhrases
                  ? '现场话术 · 可复制'
                  : hasOptions
                    ? '门牌备选'
                    : '填写攻略 · 可勾选'
          return (
            <article className="now-card__material" key={material.title}>
              <span className="eyebrow">{eyebrow}</span>
              <strong>{material.title}</strong>
              <p>{material.body}</p>
              <MaterialSteps
                fillChecks={fillChecks}
                itemId={item.id}
                material={material}
                onToggleFill={toggleFillStep}
              />
            </article>
          )
        })}

        {(item.costJpy || item.costCny) && (
          <div className="now-card__cost">
            <span className="eyebrow">费用</span>
            <p>
              {item.costJpy && `¥${item.costJpy}`}
              {item.costCny && ` · 约 ¥${item.costCny} CNY`}
            </p>
          </div>
        )}

        {extraLinks.length > 0 && (
          <div className="now-card__links">
            {extraLinks.map((link) => (
              <ExternalOrMapsLink key={link.url} label={link.label} url={link.url} />
            ))}
          </div>
        )}

        <div className="now-card__actions">
          <button
            onClick={() => {
              setSelectedDay(currentActivity.day.day)
              setView('days')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            查看今日长线行程
          </button>
          {currentActivity.navigation && (
            <MapsLink query={currentActivity.navigation.query}>
              <Icon name="map" size={15} /> 导航去{currentActivity.navigation.label}
            </MapsLink>
          )}
        </div>
      </section>
    )
  }

  const renderHeader = () => (
    <header className={`app-header ${view === 'guide' && !packingClosed ? 'app-header--packing' : ''}`}>
      <div>
        <span className="eyebrow">2026 HOKKAIDO</span>
        <h1>
          {view === 'home'
            ? journey.phase === 'after' ? '北行珍藏' : journey.phase === 'during' ? '正在北行' : '夏日北行'
            : view === 'days'
              ? `DAY ${selectedDay}`
              : view === 'guide'
                ? packingClosed
                  ? '北海道天气'
                  : `${packingOwner.trim() || travelerName.trim() || '我的'}的旅行清单`
                : morePanel === 'ratings'
                  ? '打分'
                  : '更多'}
        </h1>
      </div>
      <span className="offline-pill"><Icon name="wifi" size={15} /> 可离线</span>
    </header>
  )

  const renderHome = () => (
    <>
      {renderHeader()}
      <main>
        {journey.phase === 'during' ? (
          <>
            {(() => {
              const liveDay = tripDays[(journey.day ?? 1) - 1]
              return (
                <section
                  className="day-hero day-hero--live"
                  style={
                    {
                      '--day-accent': liveDay.accent,
                      backgroundImage: `url(${liveDay.cover})`,
                    } as CSSProperties
                  }
                >
                  <div className="day-hero__live-top">
                    <span>正在北行 · {liveDay.weekday} · {formatDate(liveDay.date)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(liveDay.day)
                        setView('days')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      全天行程
                    </button>
                  </div>
                  <h2>{liveDay.title}</h2>
                  <p>{liveDay.route}</p>
                  <small className="day-hero__place">{liveDay.coverLabel}</small>
                  {homeWeather && (
                    <button className="day-weather-chip" onClick={() => openWeatherDesk(dayLocationHint[journey.day!] ?? 'sapporo', tripDays[journey.day! - 1]?.date)} type="button">
                      <span>{homeWeather.icon} {homeWeather.label}</span>
                      <strong>{homeWeather.tempMin}–{homeWeather.tempMax}°C</strong>
                      <small>降雨 {homeWeather.precipProb}%</small>
                    </button>
                  )}
                  <div className="highlight-row">
                    {liveDay.highlights.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                    <PinnedDocDots docs={liveDay.pinnedDocs} />
                  </div>
                </section>
              )
            })()}
            {journey.day && <ParkingBar day={tripDays[journey.day - 1]} />}
            {renderNowCard()}
          </>
        ) : (
          <section
            className={`hero-panel hero-panel--${journey.phase}`}
            style={{ backgroundImage: `url(${HOME_COVER})` }}
          >
            <div className="hero-panel__texture" />
            <div className="hero-panel__content">
              <span>{journey.phase === 'after' ? 'TWO FAMILIES · ONE JOURNEY' : tripBasics.party}</span>
              <div className="countdown">
                <strong className={journey.phase === 'after' ? 'countdown__memory-date' : ''}>{journey.value}</strong>
                <p>{journey.label}</p>
              </div>
              <div className="route-line">
                <span>{journey.phase === 'after' ? '两家人的北海道旅行' : '上海'}</span>
                <i />
                <span>{journey.phase === 'after' ? '珍藏回忆' : '北海道'}</span>
              </div>
              {homeWeather && journey.phase !== 'after' && (
                <button className="hero-weather" onClick={() => openWeatherDesk('sapporo', '2026-08-23')} type="button">
                  <span>{homeWeather.icon} {homeWeather.label}</span>
                  <strong>{homeWeather.tempMin}–{homeWeather.tempMax}°C</strong>
                  <small>出发日札幌 · 雨概率 {homeWeather.precipProb}%</small>
                </button>
              )}
              <small className="hero-location">富良野 · 薰衣草花田</small>
            </div>
          </section>
        )}

        {journey.phase === 'after' && (
          <section className="memory-teaser">
            <span className="eyebrow">TRAVEL MEMORIES</span>
            <h2>旅行结束，故事才刚刚开始</h2>
            <p>旅途中上传的照片会按日期与地点整理，自动生成可播放的两家人北海道纪念册。</p>
            <div className="memory-film" aria-hidden="true">
              <i /><i /><i /><i />
            </div>
            <button onClick={() => setView('more')}>查看阶段预览与资料</button>
          </section>
        )}

        {SHOW_HOME_PARTY_SEAT && (
        <section className={`traveler-identity ${isPartyMember ? 'traveler-identity--launched' : ''}`}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">PARTY OF FOUR</span>
              <h2>{formatPartyTitle(isPartyMember)}</h2>
            </div>
            <strong className="party-seat-count">
              {PARTY_MAX}/{PARTY_MAX}
            </strong>
          </div>

          {isPartyMember ? (
            <>
              <p className="party-ready-line">{formatPartyReadyLine()}</p>
              <div className="party-name-chips" aria-label="旅行参与者">
                {FIXED_TRAVELER_NAMES.map((name) => (
                  <span className={name === travelerName ? 'filled mine' : 'filled'} key={name}>
                    {name}
                    {name === travelerName ? ' · 我' : ''}
                  </span>
                ))}
              </div>
              <p className="party-you-line">
                你是 <strong>{travelerName}</strong>
                。更换身份请到「更多」。
              </p>
            </>
          ) : (
            <>
              <p className="party-lead">
                点选你的名字对号入座（限这 4 位大人）。确认后本机身份锁定，打分会用你的称呼提问。
              </p>
              <div className="party-name-chips party-name-chips--pick" aria-label="选择你的名字">
                {FIXED_TRAVELER_NAMES.map((name) => (
                  <button
                    disabled={partyBusy}
                    key={name}
                    onClick={() => requestClaimSeat(name, 'join')}
                    type="button"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="party-preview">例如：「菜菜，你评价下这个第一个景点…」</p>
              <small className="party-footnote">一次确认即可；之后如需更换，只能在「更多」里改。</small>
            </>
          )}

          {partyMessage && <p className="ratings-message">{partyMessage}</p>}

          {isPartyMember && pendingRatingCount > 0 && (
            <button className="traveler-identity__cta" onClick={openRatingsPanel} type="button">
              去打分
              <span className="count-badge" aria-label={`${pendingRatingCount} 条待评价`}>
                {pendingRatingCount > 99 ? '99+' : pendingRatingCount}
              </span>
            </button>
          )}
        </section>
        )}

        <div className={journey.phase === 'after' || journey.phase === 'during' ? 'phase-content--hidden' : ''}>
          {SHOW_JAPANESE_LESSON && (
          <section className="section japanese-lesson">
            <div className="section-heading">
              <div><span className="eyebrow">TRAVEL JAPANESE</span><h2>出发前学几句</h2></div>
              <button
                className="text-button"
                onClick={() => {
                  setJapaneseLessonIndex((index) => (index + 1) % japaneseLessons.length)
                  setRevealedPhrases({})
                }}
              >
                换一组 <Icon name="arrow" size={15} />
              </button>
            </div>
            <div className="japanese-lesson__intro">
              <strong>{japaneseLesson.title}</strong>
              <span>{japaneseLesson.subtitle}</span>
            </div>
            <div className="japanese-phrases">
              {japaneseLesson.phrases.map((phrase, index) => {
                const key = `${japaneseLesson.id}-${index}`
                const revealed = Boolean(revealedPhrases[key])
                const speaking = speakingPhraseKey === key
                return (
                  <button
                    aria-expanded={revealed}
                    className={`${revealed ? 'revealed' : ''} ${speaking ? 'speaking' : ''}`.trim()}
                    key={key}
                    onClick={() => {
                      setRevealedPhrases((values) => ({ ...values, [key]: true }))
                      setSpeakingPhraseKey(key)
                      speakJapanese(
                        phrase.japanese,
                        () => setSpeakingPhraseKey(key),
                        () => setSpeakingPhraseKey((current) => (current === key ? null : current)),
                      )
                    }}
                    type="button"
                  >
                    <span className="japanese-phrase__chinese">{phrase.chinese}</span>
                    <small>
                      {speaking ? '正在播放女声…' : revealed ? '点击再听女声' : '点击查看日语并听女声'}
                    </small>
                    {revealed && (
                      <span className="japanese-phrase__answer">
                        <strong lang="ja">{phrase.japanese}</strong>
                        <em>{phrase.romaji}</em>
                      </span>
                    )}
                    <span className={`japanese-phrase__audio ${speaking ? 'pulse' : ''}`}>
                      <Icon name="volume" size={17} />
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="lesson-dots" aria-label="日语课程进度">
              {japaneseLessons.map((lesson, index) => (
                <button
                  aria-label={`切换到${lesson.title}`}
                  className={index === japaneseLessonIndex ? 'active' : ''}
                  key={lesson.id}
                  onClick={() => {
                    setJapaneseLessonIndex(index)
                    setRevealedPhrases({})
                  }}
                />
              ))}
            </div>
          </section>
          )}

          <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">QUICK FIND</span><h2>现场搜一下</h2></div>
          </div>
          <label className="search-box">
            <Icon name="search" size={20} />
            <input onChange={(event) => setSearch(event.target.value)} placeholder="搜索景点、餐厅、分工…" value={search} />
          </label>
          {search && (
            <div className="search-results">
              {searchResults.length === 0 && <p className="empty-state">暂时没有找到相关内容</p>}
              {searchResults.map((result) => (
                <button
                  key={result.key}
                  onClick={() => result.target === 'days' ? openDay(result.dayNumber) : setView(result.target)}
                >
                  <span>{result.kicker}</span>
                  <strong>{result.title}</strong>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
            </div>
          )}
          </section>

          <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">8 DAYS</span><h2>每日路线</h2></div>
            <button className="text-button" onClick={() => {
              syncViewsToLiveDay()
              setView('days')
              scrollToLiveTimeline()
            }}>展开全部</button>
          </div>
          <div className="day-scroller">
            {tripDays.map((day) => <DayCard day={day} key={day.day} onOpen={() => openDay(day.day)} />)}
          </div>
          </section>

          <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">AT A GLANCE</span><h2>{packingClosed ? '旅途工具' : '出发前'}</h2></div>
          </div>
          <div className="quick-grid">
            {packingClosed ? (
              <button onClick={() => openWeatherDesk()}>
                <Icon name="weather" /><span><strong>天气预报</strong><small>气象厅 JMA</small></span>
              </button>
            ) : (
              <button onClick={() => setView('guide')}>
                <Icon name="suitcase" /><span><strong>行李清单</strong><small>可勾选保存</small></span>
              </button>
            )}
            <button onClick={() => setView('more')}>
              <Icon name="info" /><span><strong>预算与应急</strong><small>离线速查</small></span>
            </button>
            <button onClick={openRatingsPanel}>
              <Icon name="star" />
              <span>
                <strong>景点打分</strong>
                <small>{pendingRatingCount > 0 ? `${pendingRatingCount} 条待评` : '玩完再评'}</small>
              </span>
              {pendingRatingCount > 0 && (
                <em className="count-badge" aria-hidden="true">
                  {pendingRatingCount > 99 ? '99+' : pendingRatingCount}
                </em>
              )}
            </button>
          </div>
          </section>
        </div>
      </main>
    </>
  )

  const renderDays = () => (
    <>
      {renderHeader()}
      <main>
        <div className="day-tabs" role="tablist">
          {tripDays.map((day) => (
            <button
              aria-selected={day.day === selectedDay}
              className={day.day === selectedDay ? 'active' : ''}
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              role="tab"
            >
              <strong>{day.day}</strong>
              <span>{formatDate(day.date).replace('月', '/').replace('日', '')}</span>
            </button>
          ))}
        </div>

        <section
          className="day-hero"
          style={{ '--day-accent': currentDay.accent, backgroundImage: `url(${currentDay.cover})` } as CSSProperties}
        >
          <span>{currentDay.weekday} · {formatDate(currentDay.date)}</span>
          <h2>{currentDay.title}</h2>
          <p>{currentDay.route}</p>
          <small className="day-hero__place">{currentDay.coverLabel}</small>
          {currentDayWeather && (
            <button className="day-weather-chip" onClick={() => {
              openWeatherDesk(dayLocationHint[currentDay.day] ?? 'sapporo', currentDay.date)
            }} type="button">
              <span>{currentDayWeather.icon} {currentDayWeather.label}</span>
              <strong>{currentDayWeather.tempMin}–{currentDayWeather.tempMax}°C</strong>
              <small>降雨 {currentDayWeather.precipProb}% · 阵风 {currentDayWeather.gustMax}m/s</small>
            </button>
          )}
          <div className="highlight-row">
            {currentDay.highlights.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
            <PinnedDocDots docs={currentDay.pinnedDocs} />
          </div>
        </section>

        <ParkingBar day={currentDay} />

        <section className="day-summary">
          <p>{currentDay.summary}</p>
          <div><span>今晚住宿</span><strong>{currentDay.lodging}</strong></div>
          <details><summary>天气不好怎么办？</summary><p>{currentDay.fallback}</p></details>
        </section>

        <section className="section section--flush">
          <div className="section-heading">
            <div><span className="eyebrow">TIMELINE</span><h2>当天时间轴</h2></div>
            <label className="switch-label">
              <input checked={showRest} onChange={(event) => setShowRest(event.target.checked)} type="checkbox" />
              <span />显示休息
            </label>
          </div>
          <div className="timeline">
            {visibleTimeline.map((item) => (
              <TimelineCard
                checked={Boolean(completed[item.id])}
                fillChecks={fillChecks}
                item={item}
                key={item.id}
                onToggle={() => setCompleted((value) => ({ ...value, [item.id]: !value[item.id] }))}
                onToggleFill={(key) => setFillChecks((values) => ({ ...values, [key]: !values[key] }))}
              />
            ))}
          </div>
        </section>

        <section className="reminder-card">
          <span className="eyebrow">DON&apos;T FORGET</span>
          <h2>当天提醒</h2>
          <ul>{currentDay.reminders.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </main>
    </>
  )

  const refreshWeather = () => {
    setWeatherStatus('loading')
    setWeatherError('')
    void fetchAllForecasts()
      .then((result) => {
        setWeatherForecasts(result.forecasts)
        setWeatherUpdatedAt(new Date().toISOString())
        setWeatherStatus('ready')
        setWeatherNote(
          result.fromCache
            ? '正在用上次缓存，网络恢复后会自动更新。'
            : result.partial
              ? '部分地点刷新成功，其余地点稍后再试。'
              : '',
        )
      })
      .catch((error: unknown) => {
        if (weatherForecasts.length > 0) {
          setWeatherStatus('ready')
          setWeatherNote(error instanceof Error ? error.message : '刷新失败，先看缓存')
          return
        }
        setWeatherStatus('error')
        setWeatherError(error instanceof Error ? error.message : '刷新失败')
      })
  }

  const renderWeatherDesk = () => (
    <section className="weather-desk">
      <div className="weather-desk__heading">
        <div>
          <span className="eyebrow">WEATHER</span>
          <h2>北海道天气</h2>
          <p>
            优先日本气象厅（JMA）官方预报，并用 Open-Meteo 补小时风力；失败时自动降级。成功后缓存在本机。
            {weatherSourceLabel && ` ${weatherSourceLabel}。`}
            {weatherUpdatedAt && ` 最近更新 ${new Date(weatherUpdatedAt).toLocaleString('zh-CN', { hour12: false })}`}
          </p>
        </div>
        <button
          className="weather-refresh"
          disabled={weatherStatus === 'loading'}
          onClick={refreshWeather}
          type="button"
        >
          {weatherStatus === 'loading' ? '刷新中…' : '立即刷新'}
        </button>
      </div>

      {weatherNote && <p className="weather-empty">{weatherNote}</p>}
      {weatherStatus === 'error' && <p className="weather-error">{weatherError || '天气数据加载失败，请稍后刷新。'}</p>}

      <div className="trip-weather-strip">
        <div className="section-heading">
          <div><span className="eyebrow">TRIP DAYS</span><h2>行程日天气速览</h2></div>
        </div>
        <div className="trip-weather-scroller">
          {tripWeatherStrip.map(({ day, weather }) => (
            <button
              className={weatherDate === day.date ? 'active' : ''}
              key={day.date}
              onClick={() => {
                setWeatherDate(day.date)
                setWeatherLocationId(dayLocationHint[day.day] ?? 'sapporo')
              }}
              type="button"
            >
              <span>D{day.day}</span>
              <strong>{weather ? `${weather.icon} ${weather.tempMax}°` : '…'}</strong>
              <small>{weather ? `${weather.precipProb}%雨` : '加载中'}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="weather-location-tabs" aria-label="天气预报地点">
        {weatherLocations.map((location) => (
          <button
            className={weatherLocationId === location.id ? 'active' : ''}
            key={location.id}
            onClick={() => setWeatherLocationId(location.id)}
            type="button"
          >
            <span>{location.name}</span>
            <small>{location.role}</small>
          </button>
        ))}
      </div>

      {selectedWeatherDay ? (
        <article className={`weather-day-card weather-day-card--${selectedWeatherDay.risk}`}>
          <header>
            <div>
              <span>{selectedWeatherForecast?.location.name} · {weatherDate.slice(5).replace('-', '/')}</span>
              <h3>{selectedWeatherDay.icon} {selectedWeatherDay.label}</h3>
            </div>
            <strong>{selectedWeatherDay.tempMin}–{selectedWeatherDay.tempMax}°C</strong>
          </header>
          <p>{selectedWeatherDay.riskNote}</p>
          <div className="weather-day-grid">
            <div><span>降雨概率</span><strong>{selectedWeatherDay.precipProb}%</strong></div>
            <div><span>降水量</span><strong>{selectedWeatherDay.precipSum} mm</strong></div>
            <div><span>最大风速</span><strong>{selectedWeatherDay.windMax} m/s</strong></div>
            <div><span>阵风</span><strong>{selectedWeatherDay.gustMax} m/s</strong></div>
            <div><span>紫外线</span><strong>{selectedWeatherDay.uvMax}</strong></div>
            <div><span>风险等级</span><strong>{selectedWeatherDay.risk === 'alert' ? '偏高' : selectedWeatherDay.risk === 'watch' ? '留意' : '平稳'}</strong></div>
          </div>
          <div className="hourly-weather">
            {selectedHourly.map((hour) => (
              <div key={hour.time}>
                <span>{hour.hour}</span>
                <strong>{hour.temperature}°</strong>
                <small>{hour.precipProb}%</small>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <p className="weather-empty">{weatherStatus === 'loading' ? '正在拉取未来 16 天预报…' : '所选日期暂无详细预报。'}</p>
      )}

      <div className="weather-table">
        {(selectedWeatherForecast?.daily.filter((day) => tripDateSet.has(day.date)) ?? []).map((day) => (
          <button
            className={weatherDate === day.date ? 'active' : ''}
            key={day.date}
            onClick={() => setWeatherDate(day.date)}
            type="button"
          >
            <span>{day.date.slice(5)}</span>
            <strong>{day.icon} {day.label}</strong>
            <em>{day.tempMin}/{day.tempMax}°C</em>
            <small>雨 {day.precipProb}% · 风 {day.windMax}</small>
          </button>
        ))}
      </div>
    </section>
  )

  const renderGuide = () => (
    <>
      {renderHeader()}
      <main>
        {packingClosed ? (
          renderWeatherDesk()
        ) : (
        <section className="packing-manager">
          <div className="packing-sticky-summary">
            <div className="packing-manager__heading">
              <div>
                <span className="eyebrow">PERSONAL PACKING</span>
                <h2>{packingOwner.trim() ? `${packingOwner.trim()}的旅行清单` : '我的旅行清单'}</h2>
              </div>
              <strong>{packedItems}/{totalPackingItems}</strong>
            </div>
            <p>清单只保存在这台设备，不会混入其他人的记录。</p>
          </div>

          <div className="packing-preferences">
            <label className="owner-field">
              <span>清单属于</span>
              <input
                maxLength={16}
                onChange={(event) => setPackingOwner(event.target.value)}
                placeholder={travelerName.trim() || '输入你的名字'}
                value={packingOwner}
              />
            </label>
            <label className="show-packed-toggle">
              <input
                checked={showPacked}
                onChange={(event) => setShowPacked(event.target.checked)}
                type="checkbox"
              />
              <span>{showPacked && <Icon name="check" size={14} />}</span>
              显示已打勾项目
            </label>
          </div>

          {packingLists.length > 0 && (
            <nav className="packing-tabs" aria-label="行李清单大类">
              {packingLists.map((list) => {
                const checkedCount = list.items.filter((item) => item.checked).length
                const isActive = list.id === activePackingList?.id
                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={isActive ? 'active' : ''}
                    key={list.id}
                    onClick={() => setActivePackingListId(list.id)}
                    type="button"
                  >
                    <span>{list.title}</span>
                    <small>{checkedCount}/{list.items.length}</small>
                  </button>
                )
              })}
            </nav>
          )}

          {activePackingList ? (() => {
            const checkedCount = activePackingList.items.filter((item) => item.checked).length
            const visibleItems = showPacked
              ? activePackingList.items
              : activePackingList.items.filter((item) => !item.checked)
            return (
              <article className="packing-group" key={activePackingList.id}>
                <header>
                  <h3>{activePackingList.title}</h3>
                  <div>
                    <strong>{checkedCount}/{activePackingList.items.length}</strong>
                    <button
                      aria-label={`删除${activePackingList.title}整组清单`}
                      className="packing-delete-list"
                      onClick={() => deletePackingList(activePackingList.id, activePackingList.title)}
                      type="button"
                    >
                      删除整组
                    </button>
                  </div>
                </header>
                <div className="checklist">
                  {visibleItems.map((item) => (
                    <div className="packing-item-row" key={item.id}>
                      <label className={item.checked ? 'checked' : ''}>
                        <input
                          checked={item.checked}
                          onChange={() => togglePackingItem(activePackingList.id, item.id)}
                          type="checkbox"
                        />
                        <span>{item.checked && <Icon name="check" size={15} />}</span>
                        {item.text}
                      </label>
                      <button
                        aria-label={`删除${item.text}`}
                        onClick={() => deletePackingItem(activePackingList.id, item.id)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {visibleItems.length === 0 && (
                    <p className="packing-empty">
                      {activePackingList.items.length === 0
                        ? '还没有项目，从下面添加一个吧。'
                        : '这一类已经全部准备完成。'}
                    </p>
                  )}
                </div>
                <form
                  className="packing-add-item"
                  onSubmit={(event) => addPackingItem(event, activePackingList.id)}
                >
                  <input
                    onChange={(event) =>
                      setNewItemText((values) => ({ ...values, [activePackingList.id]: event.target.value }))}
                    placeholder="添加一个项目"
                    value={newItemText[activePackingList.id] ?? ''}
                  />
                  <button type="submit">添加</button>
                </form>
              </article>
            )
          })() : (
            <p className="packing-no-lists">还没有清单，请从在线文档大类添加，或 DIY 一个新清单。</p>
          )}

          <form className="packing-add-template" onSubmit={addPackingTemplate}>
            <select onChange={(event) => setTemplateToAdd(event.target.value)} value={templateToAdd}>
              <option value="">
                {packingTemplates.every((template) =>
                  packingLists.some((list) => list.templateId === template.id || list.id === template.id),
                )
                  ? '在线文档大类均已加入'
                  : '选择在线文档大类'}
              </option>
              {packingTemplates
                .filter((template) =>
                  !packingLists.some((list) => list.templateId === template.id || list.id === template.id),
                )
                .map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
            </select>
            <button disabled={!templateToAdd} type="submit">添加整组</button>
          </form>

          <form className="packing-add-list" onSubmit={addPackingList}>
            <input
              maxLength={30}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="例如：摄影装备"
              value={newListName}
            />
            <button type="submit">＋ DIY 新清单</button>
          </form>
        </section>
        )}
      </main>
    </>
  )

  const renderRatingsPanel = () => {
    const list =
      ratingFilter === 'open'
        ? ratingBuckets.open
        : ratingFilter === 'locked'
          ? ratingBuckets.locked
          : ratingBuckets.done

    return (
      <section className="ratings-panel">
        <button className="text-button ratings-back" onClick={() => setMorePanel('hub')} type="button">
          ← 返回更多
        </button>
        <div className="section-heading">
          <div>
            <span className="eyebrow">RATE THE DAY</span>
            <h2>{travelerName.trim() ? `${travelerName.trim()}的打分` : '旅行打分'}</h2>
          </div>
          {pendingRatingCount > 0 && (
            <span className="count-badge count-badge--inline" aria-label={`${pendingRatingCount} 条待评价`}>
              {pendingRatingCount > 99 ? '99+' : pendingRatingCount}
            </span>
          )}
        </div>
        <p className="ratings-lead">
          景点 / 晚餐结束后才会开放。评分先存在本机，结构已预留后续写入数据库。
        </p>
        {!isPartyMember && (
          <p className="ratings-warn">请先回首页确认加入旅行名单，评分才会记到你名下。</p>
        )}
        <div className="rating-filter-tabs" role="tablist" aria-label="打分筛选">
          {(
            [
              ['open', `待评价 ${ratingBuckets.open.length}`],
              ['done', `已评价 ${ratingBuckets.done.length}`],
              ['locked', `未开放 ${ratingBuckets.locked.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              aria-selected={ratingFilter === id}
              className={ratingFilter === id ? 'active' : ''}
              key={id}
              onClick={() => setRatingFilter(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {ratingMessage && <p className="ratings-message">{ratingMessage}</p>}
        <div className="rating-list">
          {list.length === 0 && (
            <p className="empty-state">
              {ratingFilter === 'open'
                ? '太棒了，当前没有待评价项目'
                : ratingFilter === 'done'
                  ? '还没有已保存的评分'
                  : '没有锁定中的项目'}
            </p>
          )}
          {list.map((target, index) => renderRatingCard(target, index, ratingFilter))}
        </div>
      </section>
    )
  }

  const renderMore = () => (
    <>
      {renderHeader()}
      <main>
        {morePanel === 'ratings' ? (
          renderRatingsPanel()
        ) : (
          <>
        <section className="more-feature-grid">
          <button className="more-feature-card" onClick={openRatingsPanel} type="button">
            <span className="more-feature-card__icon"><Icon name="star" size={22} /></span>
            <span>
              <strong>打分</strong>
              <small>景点 / 晚餐结束后评价</small>
            </span>
            {pendingRatingCount > 0 && (
              <em className="count-badge" aria-label={`${pendingRatingCount} 条待评价`}>
                {pendingRatingCount > 99 ? '99+' : pendingRatingCount}
              </em>
            )}
          </button>
        </section>

        <section className="party-manage">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TRAVELER NAME</span>
              <h2>旅行者名称</h2>
            </div>
            <strong className="party-seat-count">
              {PARTY_MAX}/{PARTY_MAX}
            </strong>
          </div>
          <p className="party-ready-line">{formatPartyReadyLine()}</p>
          <p className="party-lead">
            {isPartyMember ? `当前身份：${travelerName}。点选下方名字可更换（需二次确认）。` : '点选你的名字入座；身份只保存在这台手机。'}
          </p>
          <div className="party-name-chips party-name-chips--pick" aria-label="更换旅行者身份">
            {FIXED_TRAVELER_NAMES.map((name) => (
              <button
                className={isPartyMember && name === travelerName ? 'selected' : ''}
                disabled={partyBusy}
                key={name}
                onClick={() => requestClaimSeat(name, isPartyMember ? 'rename' : 'join')}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
          <small className="party-footnote">名单固定为四位大人，无需联网；身份只保存在这台手机。</small>
          {partyMessage && <p className="ratings-message">{partyMessage}</p>}
        </section>

        {!packingClosed && renderWeatherDesk()}

        <section className="more-handbook">
          <span className="eyebrow">POCKET GUIDE</span>
          <h2>旅行手册</h2>
          <p>预约、预算与应急信息集中在这里，网络不好时也能离线速查。</p>
          <div className="more-handbook__sections">
            {guideSections.map((section) => (
              <details key={section.id}>
                <summary>
                  <span><strong>{section.title}</strong><small>{section.intro}</small></span>
                  <Icon name="arrow" size={17} />
                </summary>
                <div className="info-list">
                  {section.items.map((item) => (
                    <article key={item.title}>
                      <div><strong>{item.title}</strong><span>{item.badge}</span></div>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
        <section className="preview-card debug-time-card">
          <div>
            <span className="eyebrow">DEBUG · TIME MACHINE</span>
            <h2>模拟旅行时间</h2>
            <p>测试期优先入口：顶部常驻「调时间」。点下方按钮可打开同一套快捷面板（选日、选整点、±15 分钟）。</p>
          </div>
          <div className="debug-time-status">
            <span>{isSimulating ? '模拟中' : '真实时间'}</span>
            <strong>{formatSimClock(now)}</strong>
          </div>
          <div className="debug-time-actions" style={{ marginTop: 14 }}>
            <button className="debug-run" type="button" onClick={openTimePanel}>
              打开调时间面板
            </button>
            <button className="debug-reset" type="button" onClick={returnToRealTime}>
              回到当前
            </button>
          </div>
        </section>
        <section className="preview-card">
          <div>
            <span className="eyebrow">REPAIR</span>
            <h2>打不开或白屏时</h2>
            <p>会清理本站缓存并重新加载，不删你的清单勾选（localStorage 行程勾选会保留）。</p>
          </div>
          <div className="debug-time-actions" style={{ marginTop: 14 }}>
            <button className="debug-reset" type="button" onClick={() => void repairAppCache()}>
              修复并重新进入
            </button>
          </div>
        </section>
        <section className="about-card">
          <span className="eyebrow">SOURCE OF TRUTH</span>
          <h2>{tripBasics.title}</h2>
          <p>{tripBasics.dateRange}</p>
          <div className="about-meta">
            <span>资料来源</span><strong>{tripBasics.source}</strong>
            <span>导入日期</span><strong>{tripBasics.sourceUpdatedAt}</strong>
            <span>同步方式</span><strong>人工快照 · 旅行中更稳定</strong>
          </div>
          <a href={sourceLink} rel="noreferrer" target="_blank">
            打开腾讯文档原表 <Icon name="external" size={16} />
          </a>
        </section>
        <section className="privacy-note">
          <Icon name="info" />
          <div>
            <strong>公开链接提示</strong>
            <p>本攻略不会公开护照号、订单号、手机号等敏感信息。更新腾讯文档后，需要重新生成一次网页数据。</p>
          </div>
        </section>
        <section className="about-footer">
          <span>HOKKAIDO · 2026</span>
          <p>为两家人的夏日北行而作</p>
        </section>
          </>
        )}
      </main>
    </>
  )

  return (
    <div className="app-shell app-shell--simulating">
      <div className={`sim-banner ${isSimulating ? 'sim-banner--active' : ''}`} role="status">
        <button className="sim-banner__clock" type="button" onClick={openTimePanel}>
          <span>{isSimulating ? '模拟时间 · 点此调整' : '测试时钟 · 点此调时间'}</span>
          <strong>{formatSimClock(now)}</strong>
        </button>
        <div className="sim-banner__actions">
          <button type="button" onClick={openTimePanel}>调时间</button>
          {isSimulating && (
            <button type="button" onClick={returnToRealTime}>回到当前</button>
          )}
        </div>
      </div>
      {view === 'home' && renderHome()}
      {view === 'days' && renderDays()}
      {view === 'guide' && renderGuide()}
      {view === 'more' && renderMore()}
      {timePanelOpen && (
        <div className="time-sheet" role="dialog" aria-modal="true" aria-labelledby="time-sheet-title">
          <button className="time-sheet__backdrop" aria-label="关闭" type="button" onClick={() => setTimePanelOpen(false)} />
          <div className="time-sheet__panel">
            <div className="time-sheet__head">
              <div>
                <span className="eyebrow">TIME MACHINE</span>
                <h2 id="time-sheet-title">调时间</h2>
              </div>
              <button className="time-sheet__close" type="button" onClick={() => setTimePanelOpen(false)}>
                关闭
              </button>
            </div>
            <div className="debug-time-status">
              <span>{isSimulating ? '模拟中' : '真实时间'}</span>
              <strong>{formatSimClock(now)}</strong>
            </div>
            <p className="time-sheet__hint">先选 DAY，再点整点；或用 ±15 分钟微调。应用后会跳到行程页方便核对。</p>

            <div className="time-sheet__section">
              <span>行程日（先选日，再点整点）</span>
              <div className="debug-day-chips" aria-label="选择行程日">
                {tripDays.map((day) => (
                  <button
                    key={day.day}
                    className={timeDraftDay === day.day ? 'is-active' : ''}
                    type="button"
                    onClick={() => setTimeDraftDay(day.day)}
                  >
                    D{day.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-sheet__section">
              <span>整点快切 · DAY {timeDraftDay}</span>
              <div className="time-hour-chips" aria-label="选择整点">
                {TIME_HOUR_PRESETS.map((hour) => (
                  <button key={hour} type="button" onClick={() => applyHourPreset(hour)}>
                    {String(hour).padStart(2, '0')}:00
                  </button>
                ))}
              </div>
            </div>

            <div className="time-sheet__section">
              <span>微调</span>
              <div className="time-nudge-chips" aria-label="时间微调">
                <button type="button" onClick={() => nudgeSim(-60 * 60 * 1000)}>−1 小时</button>
                <button type="button" onClick={() => nudgeSim(-15 * 60 * 1000)}>−15 分</button>
                <button type="button" onClick={() => nudgeSim(15 * 60 * 1000)}>+15 分</button>
                <button type="button" onClick={() => nudgeSim(60 * 60 * 1000)}>+1 小时</button>
              </div>
            </div>

            <form className="debug-time-form" onSubmit={runSimulation}>
              <label>
                <span>精确到分</span>
                <input
                  type="datetime-local"
                  value={simDraft}
                  min="2026-08-20T00:00"
                  max="2026-09-02T23:59"
                  onChange={(event) => {
                    setSimDraft(event.target.value)
                    setSimMessage('')
                  }}
                />
              </label>
              <div className="debug-time-actions">
                <button className="debug-run" type="submit">
                  应用并看行程
                </button>
                <button
                  className="debug-reset"
                  type="button"
                  onClick={() => {
                    returnToRealTime()
                    setTimePanelOpen(false)
                  }}
                >
                  回到当前
                </button>
              </div>
            </form>
            {simMessage && <p className="debug-time-message">{simMessage}</p>}
          </div>
        </div>
      )}
      {confirmDialog && (
        <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div className="confirm-dialog__panel">
            <span className="eyebrow">请再确认一次</span>
            <h2 id="confirm-dialog-title">
              {confirmDialog.mode === 'join' ? '确认对号入座？' : '确认更换身份？'}
            </h2>
            <p>
              {confirmDialog.mode === 'join'
                ? `将以「${confirmDialog.name}」加入本次旅行。确认后首页不能再改，如需更换请到「更多」。`
                : `确定切换为「${confirmDialog.name}」吗？之后打分会用新称呼提问。`}
            </p>
            <div className="confirm-dialog__actions">
              <button disabled={partyBusy} onClick={() => setConfirmDialog(null)} type="button">
                再想想
              </button>
              <button className="confirm-dialog__primary" disabled={partyBusy} onClick={confirmPartyAction} type="button">
                {partyBusy ? '提交中…' : confirmDialog.mode === 'join' ? '确认入座' : '确认更换'}
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="bottom-nav" aria-label="主要导航">
        {([
          ['home', '首页', 'home'],
          ['days', '行程', 'calendar'],
          packingClosed ? (['guide', '天气', 'weather'] as const) : (['guide', '清单', 'guide'] as const),
          ['more', '更多', 'more'],
        ] as const).map(([id, label, icon]) => (
          <button
            aria-current={view === id ? 'page' : undefined}
            className={view === id ? 'active' : ''}
            key={id}
            onClick={() => {
              if (id === 'days') {
                syncViewsToLiveDay()
                setMorePanel('hub')
                setView(id)
                setSearch('')
                if (resolveLiveDayNumber()) scrollToLiveTimeline()
                else window.scrollTo({ top: 0, behavior: 'smooth' })
                return
              }
              if (id === 'guide' && packingClosed) {
                syncViewsToLiveDay()
              }
              if (id !== 'more') setMorePanel('hub')
              setView(id)
              setSearch('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="bottom-nav__icon">
              <Icon name={icon} size={21} />
              {id === 'more' && pendingRatingCount > 0 && (
                <em className="count-badge" aria-label={`${pendingRatingCount} 条待评价`}>
                  {pendingRatingCount > 99 ? '99+' : pendingRatingCount}
                </em>
              )}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
