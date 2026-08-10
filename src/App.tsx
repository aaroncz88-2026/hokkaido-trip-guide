import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import {
  guideSections,
  mapsUrl,
  packingTemplates,
  sourceLink,
  tripBasics,
  tripDays,
  type DayPlan,
  type TimelineItem,
} from './data/trip'
import { japaneseLessons } from './data/japanese'
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
type JourneyPhase = 'before' | 'during' | 'after'
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
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-10h.01',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01',
  volume: 'M11 5 6 9H3v6h3l5 4V5Zm4.5 4a4 4 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12',
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
    <button className="day-card" onClick={onOpen} style={{ '--day-accent': day.accent } as CSSProperties}>
      <span className="day-card__index">DAY {day.day}</span>
      <span className="day-card__date">{formatDate(day.date)} · {day.weekday}</span>
      <strong>{day.title}</strong>
      <span className="day-card__route">{day.route}</span>
      <span className="day-card__cta">查看行程 <Icon name="arrow" size={16} /></span>
    </button>
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
    <article className={`timeline-card ${checked ? 'timeline-card--done' : ''}`}>
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
                {material.steps && material.steps.length > 0 && (
                  <div className="fill-guide">
                    {material.steps.map((step) => {
                      const key = `${item.id}:${step.id}`
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
                    })}
                  </div>
                )}
              </div>
            ))}
            {item.dad && <div><span>爸爸</span><p>{item.dad}</p></div>}
            {item.mom && <div><span>妈妈</span><p>{item.mom}</p></div>}
            {item.kids && <div><span>孩子</span><p>{item.kids}</p></div>}
            {(item.costJpy || item.costCny) && (
              <div><span>费用</span><p>{item.costJpy && `¥${item.costJpy}`}{item.costCny && ` · 约 ¥${item.costCny} CNY`}</p></div>
            )}
            {item.links.map((link) => (
              <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                <Icon name="external" size={15} /> {link.label}
              </a>
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
  const [packingOwner, setPackingOwner] = useState(() => localStorage.getItem('hokkaido-packing-owner') ?? '')
  const [showPacked, setShowPacked] = useState(() => localStorage.getItem('hokkaido-show-packed') !== 'false')
  const [newListName, setNewListName] = useState('')
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [templateToAdd, setTemplateToAdd] = useState('')
  const [activePackingListId, setActivePackingListId] = useState('')
  const [japaneseLessonIndex, setJapaneseLessonIndex] = useState(0)
  const [revealedPhrases, setRevealedPhrases] = useState<Record<string, boolean>>({})
  const [speakingPhraseKey, setSpeakingPhraseKey] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('hokkaido-completed', JSON.stringify(completed))
  }, [completed])

  useEffect(() => {
    localStorage.setItem('hokkaido-packing-lists-v2', JSON.stringify(packingLists))
  }, [packingLists])

  useEffect(() => {
    localStorage.setItem('hokkaido-packing-owner', packingOwner)
  }, [packingOwner])

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
  const currentActivity = useMemo(() => getCurrentActivity(now), [now])
  const visibleTimeline = currentDay.timeline.filter((item) => showRest || !item.isRest)
  const totalPackingItems = packingLists.reduce((total, list) => total + list.items.length, 0)
  const packedItems = packingLists.reduce(
    (total, list) => total + list.items.filter((item) => item.checked).length,
    0,
  )
  const activePackingList =
    packingLists.find((list) => list.id === activePackingListId) ?? packingLists[0]
  const japaneseLesson = japaneseLessons[japaneseLessonIndex]
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
    const packingMatches: SearchResult[] = packingTemplates.flatMap((section) =>
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
  }, [search])

  const openDay = (day: number) => {
    setSelectedDay(day)
    setView('days')
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const returnToRealTime = () => {
    writeSimOffset(null)
    setSimOffsetMs(null)
    const realNow = new Date()
    setSimDraft(toDatetimeLocalValue(realNow))
    setClockTick((tick) => tick + 1)
    setSimMessage('已回到真实当前时间')
  }

  const fillDayPreset = (dayNumber: number) => {
    const day = tripDays.find((item) => item.day === dayNumber)
    if (!day) return
    const [year, month, date] = day.date.split('-').map(Number)
    const preset = new Date(year, month - 1, date, 9, 0, 0, 0)
    setSimDraft(toDatetimeLocalValue(preset))
    setSimMessage(`已填入 DAY ${dayNumber} · 09:00，点「运行模拟」生效`)
  }

  const renderHeader = () => (
    <header className={`app-header ${view === 'guide' ? 'app-header--packing' : ''}`}>
      <div>
        <span className="eyebrow">2026 HOKKAIDO</span>
        <h1>
          {view === 'home'
            ? journey.phase === 'after' ? '北行珍藏' : journey.phase === 'during' ? '正在北行' : '夏日北行'
            : view === 'days'
              ? `DAY ${selectedDay}`
              : view === 'guide'
                ? `${packingOwner.trim() || '我的'}的旅行清单`
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
        <section
          className={`hero-panel hero-panel--${journey.phase}`}
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}furano-lavender-cover.png)` }}
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
            <small className="hero-location">富良野 · 薰衣草花田</small>
          </div>
        </section>

        {journey.phase === 'during' && currentActivity && (
          <section className="now-card">
            <div className="now-card__head">
              <span className="eyebrow">NOW · DAY {currentActivity.day.day}</span>
              <strong>{currentActivity.item.time}</strong>
            </div>
            <h2>{currentActivity.item.title}</h2>
            <p>{currentActivity.item.detail}</p>

            <div className="now-card__tasks">
              <span className="eyebrow">家庭分工 · 全部展开</span>
              {currentActivity.item.dad ? (
                <div><em>爸爸</em><p>{currentActivity.item.dad}</p></div>
              ) : (
                <div><em>爸爸</em><p>本时段无额外任务</p></div>
              )}
              {currentActivity.item.mom ? (
                <div><em>妈妈</em><p>{currentActivity.item.mom}</p></div>
              ) : (
                <div><em>妈妈</em><p>本时段无额外任务</p></div>
              )}
              {currentActivity.item.kids ? (
                <div><em>孩子</em><p>{currentActivity.item.kids}</p></div>
              ) : (
                <div><em>孩子</em><p>本时段无额外任务</p></div>
              )}
            </div>

            {currentActivity.item.materials.map((material) => (
              <article className="now-card__material" key={material.title}>
                <span className="eyebrow">填写攻略 · 可勾选</span>
                <strong>{material.title}</strong>
                <p>{material.body}</p>
                {material.steps && material.steps.length > 0 && (
                  <div className="fill-guide">
                    {material.steps.map((step) => {
                      const key = `${currentActivity.item.id}:${step.id}`
                      return (
                        <label className={fillChecks[key] ? 'fill-guide__step done' : 'fill-guide__step'} key={step.id}>
                          <input
                            checked={Boolean(fillChecks[key])}
                            type="checkbox"
                            onChange={() =>
                              setFillChecks((values) => ({ ...values, [key]: !values[key] }))
                            }
                          />
                          <span>
                            <strong>{step.field}</strong>
                            <small>{step.how}</small>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </article>
            ))}

            {(currentActivity.item.costJpy || currentActivity.item.costCny) && (
              <div className="now-card__cost">
                <span className="eyebrow">费用</span>
                <p>
                  {currentActivity.item.costJpy && `¥${currentActivity.item.costJpy}`}
                  {currentActivity.item.costCny && ` · 约 ¥${currentActivity.item.costCny} CNY`}
                </p>
              </div>
            )}

            {currentActivity.item.links.length > 0 && (
              <div className="now-card__links">
                {currentActivity.item.links.map((link) => (
                  <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                    <Icon name="external" size={15} /> {link.label}
                  </a>
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
                <a href={mapsUrl(currentActivity.navigation.query)} rel="noreferrer" target="_blank">
                  <Icon name="map" size={15} /> 导航去{currentActivity.navigation.label}
                </a>
              )}
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

        <div className={journey.phase === 'after' ? 'phase-content--hidden' : ''}>
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
            <button className="text-button" onClick={() => setView('days')}>展开全部</button>
          </div>
          <div className="day-scroller">
            {tripDays.map((day) => <DayCard day={day} key={day.day} onOpen={() => openDay(day.day)} />)}
          </div>
          </section>

          <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">AT A GLANCE</span><h2>出发前</h2></div>
          </div>
          <div className="quick-grid">
            <button onClick={() => setView('guide')}>
              <Icon name="suitcase" /><span><strong>行李清单</strong><small>可勾选保存</small></span>
            </button>
            <button onClick={() => setView('more')}>
              <Icon name="info" /><span><strong>预算与应急</strong><small>离线速查</small></span>
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

        <section className="day-hero" style={{ '--day-accent': currentDay.accent } as CSSProperties}>
          <span>{currentDay.weekday} · {formatDate(currentDay.date)}</span>
          <h2>{currentDay.title}</h2>
          <p>{currentDay.route}</p>
          <div className="highlight-row">
            {currentDay.highlights.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="day-summary">
          <p>{currentDay.summary}</p>
          <div><span>今晚住宿</span><strong>{currentDay.lodging}</strong></div>
          <details><summary>天气不好怎么办？</summary><p>{currentDay.fallback}</p></details>
        </section>

        <section className="section section--flush">
          <div className="section-heading">
            <div><span className="eyebrow">NAVIGATION</span><h2>一键导航</h2></div>
          </div>
          <div className="nav-links">
            {currentDay.navigation.map((item) => (
              <a href={mapsUrl(item.query)} key={item.label} rel="noreferrer" target="_blank">
                <Icon name="map" size={18} /> {item.label} <Icon name="external" size={14} />
              </a>
            ))}
          </div>
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

  const renderGuide = () => (
    <>
      {renderHeader()}
      <main>
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
                placeholder="输入你的名字"
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
      </main>
    </>
  )

  const renderMore = () => (
    <>
      {renderHeader()}
      <main>
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
            <p>选好日期和时间后运行模拟，首页会按该时刻显示阶段与当前事项。可随时回到真实时间。</p>
          </div>

          <div className="debug-time-status">
            <span>{isSimulating ? '模拟中' : '真实时间'}</span>
            <strong>{formatSimClock(now)}</strong>
          </div>

          <form className="debug-time-form" onSubmit={runSimulation}>
            <label>
              <span>日期与时间</span>
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
            <div className="debug-day-chips" aria-label="快速填入行程日">
              {tripDays.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => fillDayPreset(day.day)}
                >
                  D{day.day}
                </button>
              ))}
            </div>
            <div className="debug-time-actions">
              <button className="debug-run" type="submit">
                运行模拟
              </button>
              <button className="debug-reset" type="button" onClick={returnToRealTime}>
                回到当前
              </button>
            </div>
          </form>

          {simMessage && <p className="debug-time-message">{simMessage}</p>}
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
      </main>
    </>
  )

  return (
    <div className={`app-shell ${isSimulating ? 'app-shell--simulating' : ''}`}>
      {isSimulating && (
        <div className="sim-banner" role="status">
          <div>
            <span>模拟时间</span>
            <strong>{formatSimClock(now)}</strong>
          </div>
          <div className="sim-banner__actions">
            <button type="button" onClick={() => setView('more')}>调整</button>
            <button type="button" onClick={returnToRealTime}>回到当前</button>
          </div>
        </div>
      )}
      {view === 'home' && renderHome()}
      {view === 'days' && renderDays()}
      {view === 'guide' && renderGuide()}
      {view === 'more' && renderMore()}
      <nav className="bottom-nav" aria-label="主要导航">
        {([
          ['home', '首页', 'home'],
          ['days', '行程', 'calendar'],
          ['guide', '清单', 'guide'],
          ['more', '更多', 'more'],
        ] as const).map(([id, label, icon]) => (
          <button
            aria-current={view === id ? 'page' : undefined}
            className={view === id ? 'active' : ''}
            key={id}
            onClick={() => {
              if (id === 'days' && journey.day) setSelectedDay(journey.day)
              setView(id)
              setSearch('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
