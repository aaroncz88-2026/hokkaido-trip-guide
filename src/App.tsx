import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  guideSections,
  mapsUrl,
  sourceLink,
  tripBasics,
  tripDays,
  type DayPlan,
  type TimelineItem,
} from './data/trip'
import './App.css'

type View = 'home' | 'days' | 'guide' | 'more'
type PreviewPhase = 'auto' | 'before' | 'during' | 'after'
type JourneyState = {
  phase: Exclude<PreviewPhase, 'auto'>
  value: string
  label: string
  day: number | null
}
type SearchResult = {
  key: string
  kicker: string
  title: string
  dayNumber: number
  target: 'days' | 'guide'
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

const getJourneyState = (preview: PreviewPhase): JourneyState => {
  if (preview === 'before') return { phase: 'before', value: '18', label: '天后出发', day: null }
  if (preview === 'during') return { phase: 'during', value: 'DAY 1', label: '旅行第 1 天 · 抵达北海道', day: 1 }
  if (preview === 'after') {
    return {
      phase: 'after',
      value: '2026.08.23 — 08.30',
      label: '两家人的北海道旅行 · 珍藏回忆',
      day: null,
    }
  }

  const today = new Date()
  const start = new Date('2026-08-23T00:00:00+08:00')
  const end = new Date('2026-08-30T23:59:59+08:00')
  if (today > end) {
    return {
      phase: 'after',
      value: '2026.08.23 — 08.30',
      label: '两家人的北海道旅行 · 珍藏回忆',
      day: null,
    }
  }
  if (today >= start) {
    const day = Math.min(8, Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1)
    return {
      phase: 'during',
      value: `DAY ${day}`,
      label: `旅行第 ${day} 天 · ${tripDays[day - 1].title}`,
      day,
    }
  }
  const days = Math.ceil((start.getTime() - today.getTime()) / 86_400_000)
  return { phase: 'before', value: `${days}`, label: '天后出发', day: null }
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
}: {
  item: TimelineItem
  checked: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(item.dad || item.mom || item.kids || item.links.length || item.costJpy)

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
        {hasDetails && (
          <button className="text-button" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起细节' : '分工与资料'}
            <span className={expanded ? 'chevron chevron--up' : 'chevron'}><Icon name="arrow" size={15} /></span>
          </button>
        )}
        {expanded && (
          <div className="timeline-details">
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
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>('auto')
  const [showRest, setShowRest] = useState(false)
  const [search, setSearch] = useState('')
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('hokkaido-completed') ?? '{}')
    } catch {
      return {}
    }
  })
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('hokkaido-checklist') ?? '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem('hokkaido-completed', JSON.stringify(completed))
  }, [completed])

  useEffect(() => {
    localStorage.setItem('hokkaido-checklist', JSON.stringify(checklist))
  }, [checklist])

  const currentDay = tripDays.find((day) => day.day === selectedDay) ?? tripDays[0]
  const journey = getJourneyState(previewPhase)
  const visibleTimeline = currentDay.timeline.filter((item) => showRest || !item.isRest)
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
    const guideMatches: SearchResult[] = guideSections.flatMap((section): SearchResult[] =>
      'items' in section
        ? section.items
            .filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(keyword))
            .map((item) => ({
              key: `${section.id}-${item.title}`,
              kicker: section.title,
              title: item.title,
              dayNumber: 0,
              target: 'guide' as const,
            }))
        : section.checklist
            .filter((item) => item.toLowerCase().includes(keyword))
            .map((item) => ({
              key: `${section.id}-${item}`,
              kicker: section.title,
              title: item,
              dayNumber: 0,
              target: 'guide' as const,
            })),
    )
    return [...dayMatches, ...timelineMatches, ...guideMatches].slice(0, 20)
  }, [search])

  const openDay = (day: number) => {
    setSelectedDay(day)
    setView('days')
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderHeader = () => (
    <header className="app-header">
      <div>
        <span className="eyebrow">2026 HOKKAIDO</span>
        <h1>
          {view === 'home'
            ? journey.phase === 'after' ? '北行珍藏' : journey.phase === 'during' ? '正在北行' : '夏日北行'
            : view === 'days' ? `DAY ${selectedDay}` : view === 'guide' ? '旅行手册' : '关于攻略'}
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
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}biei-blue-pond-cover.png)` }}
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
            <small className="hero-location">美瑛 · 白金青池</small>
          </div>
        </section>

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
                  onClick={() => result.target === 'days' ? openDay(result.dayNumber) : setView('guide')}
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
            <button onClick={() => setView('guide')}>
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
                item={item}
                key={item.id}
                onToggle={() => setCompleted((value) => ({ ...value, [item.id]: !value[item.id] }))}
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
        <section className="guide-intro">
          <span className="eyebrow">POCKET GUIDE</span>
          <h2>把重要信息放进口袋</h2>
          <p>网络不好时也能打开；勾选状态只保存在你的设备。</p>
        </section>
        {guideSections.map((section) => (
          <section className="section guide-section" key={section.id}>
            <div className="section-heading">
              <div><h2>{section.title}</h2><p>{section.intro}</p></div>
            </div>
            {'checklist' in section ? (
              <div className="checklist">
                {section.checklist.map((item) => (
                  <label className={checklist[item] ? 'checked' : ''} key={item}>
                    <input
                      checked={Boolean(checklist[item])}
                      onChange={() => setChecklist((value) => ({ ...value, [item]: !value[item] }))}
                      type="checkbox"
                    />
                    <span>{checklist[item] && <Icon name="check" size={15} />}</span>
                    {item}
                  </label>
                ))}
              </div>
            ) : (
              <div className="info-list">
                {section.items.map((item) => (
                  <article key={item.title}>
                    <div><strong>{item.title}</strong><span>{item.badge}</span></div>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </>
  )

  const renderMore = () => (
    <>
      {renderHeader()}
      <main>
        <section className="preview-card">
          <div>
            <span className="eyebrow">TIME MACHINE</span>
            <h2>预览旅行的三个阶段</h2>
            <p>这里只改变预览，不会影响真实日期。</p>
          </div>
          <div className="phase-buttons">
            {([
              ['auto', '自动'],
              ['before', '旅行前'],
              ['during', '旅行第1天'],
              ['after', '旅行结束'],
            ] as const).map(([phase, label]) => (
              <button
                className={previewPhase === phase ? 'active' : ''}
                key={phase}
                onClick={() => {
                  setPreviewPhase(phase)
                  setView('home')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                {label}
              </button>
            ))}
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
      </main>
    </>
  )

  return (
    <div className="app-shell">
      {view === 'home' && renderHome()}
      {view === 'days' && renderDays()}
      {view === 'guide' && renderGuide()}
      {view === 'more' && renderMore()}
      <nav className="bottom-nav" aria-label="主要导航">
        {([
          ['home', '首页', 'home'],
          ['days', '行程', 'calendar'],
          ['guide', '手册', 'guide'],
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
