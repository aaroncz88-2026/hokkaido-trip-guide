import sheetData from './sheetData.json'

export type SourceCell = {
  text: string
  url: string | null
}

export type TimelineItem = {
  id: string
  time: string
  title: string
  detail: string
  tags: string[]
  dad: string
  mom: string
  kids: string
  links: { label: string; url: string }[]
  costJpy: string
  costCny: string
  isRest: boolean
}

export type DayMeta = {
  day: number
  date: string
  weekday: string
  title: string
  route: string
  summary: string
  lodging: string
  fallback: string
  accent: string
  highlights: string[]
  navigation: { label: string; query: string }[]
  reminders: string[]
}

export type DayPlan = DayMeta & {
  timeline: TimelineItem[]
}

const dayMeta: DayMeta[] = [
  {
    day: 1,
    date: '2026-08-23',
    weekday: '周日',
    title: '抵达北海道',
    route: '新千岁机场 → 支笏湖 → 留寿都',
    summary: '落地取车后先看湖，傍晚入住留寿都。',
    lodging: '翠葉 Rusutsu',
    fallback: '大雨或大风时取消支笏湖，留在机场用餐采购后直接入住。',
    accent: '#2f6f68',
    highlights: ['机场取车', '支笏湖观光船', '山线铁桥', 'Seicomart 采购'],
    navigation: [
      { label: '支笏湖停车场', query: 'Lake Shikotsu Parking Lot' },
      { label: '支笏湖游船', query: 'Lake Shikotsu Sightseeing Ship' },
      { label: '入住地', query: 'Suiyo Rusutsu' },
    ],
    reminders: ['落地后先完成入境、行李和取车', '争取 15:00 到支笏湖', '晚间采购次日早餐与饮用水'],
  },
  {
    day: 2,
    date: '2026-08-24',
    weekday: '周一',
    title: '留寿都游乐日',
    route: '留寿都度假村全天',
    summary: '游乐园、羊蹄山缆车和亲子项目的一整天。',
    lodging: '翠葉 Rusutsu',
    fallback: '下雨改去 Upopoy 阿伊努民族博物馆，也可与 DAY3 对调。',
    accent: '#dc6b45',
    highlights: ['游乐园', '羊蹄山缆车', '亲子项目', '园区晚餐'],
    navigation: [
      { label: '留寿都度假村', query: 'Rusutsu Resort Amusement Park' },
      { label: '居酒屋かかし', query: '居酒屋 かかし Rusutsu' },
    ],
    reminders: ['提前网上购票比现场更省', '午餐按所在区域就近解决', '游乐园不建议撑伞，带雨衣'],
  },
  {
    day: 3,
    date: '2026-08-25',
    weekday: '周二',
    title: '火山与洞爷湖',
    route: '有珠山 → Lake Hill Farm → 洞爷湖',
    summary: '火山地貌、牧场下午茶、湖畔散步和夜间烟花。',
    lodging: '翠葉 Rusutsu',
    fallback: '下雨改去 Upopoy 或登别时代村；也可缩短湖畔步行。',
    accent: '#a35d3d',
    highlights: ['有珠山缆车', 'Lake Hill Farm', '火山科学馆', '洞爷湖烟花'],
    navigation: [
      { label: '有珠山缆车', query: 'Usuzan Ropeway' },
      { label: 'Lake Hill Farm', query: 'Lake Hill Farm Toyako' },
      { label: '洞爷湖游客中心', query: 'Toyako Visitor Center' },
      { label: '洞爷湖温泉街', query: 'Toyako Onsen' },
    ],
    reminders: ['Oktoberfest 早餐后出发', '20:25 前到湖边等烟花', '缆车和湖边风大，带防风外套'],
  },
  {
    day: 4,
    date: '2026-08-26',
    weekday: '周三',
    title: '一路去札幌',
    route: '留寿都 → 定山溪 → 白色恋人公园 → 札幌',
    summary: '退房换城市，以温泉街和甜点主题公园串起转场日。',
    lodging: '札幌市区公寓',
    fallback: '雨天减少定山溪户外步行，把时间留给白色恋人公园室内区域。',
    accent: '#99618e',
    highlights: ['定山溪散步', '温泉街午餐', '白色恋人公园', '狸小路'],
    navigation: [
      { label: '定山溪游客中心', query: 'Jozankei Tourist Information Center' },
      { label: '白色恋人公园', query: 'Shiroi Koibito Park' },
      { label: '狸小路', query: 'Tanukikoji Shopping Street' },
    ],
    reminders: ['出发前完成垃圾分类和退房检查', '白色恋人公园预留约 3 小时', '晚餐 GAjA 已作为首选'],
  },
  {
    day: 5,
    date: '2026-08-27',
    weekday: '周四',
    title: '美瑛与富良野',
    route: '札幌 → 青池 → 白须瀑布 → 四季彩之丘 → 富田农场 → 精灵露台',
    summary: '全程最长的一天，花田、瀑布和森林夜景连续推进。',
    lodging: '札幌市区公寓',
    fallback: '天气差时缩短青池与花田停留，优先保证安全返程。',
    accent: '#4d78a8',
    highlights: ['青池', '白须瀑布', '四季彩之丘', '富田农场', '森林精灵露台'],
    navigation: [
      { label: '青池停车场', query: 'Shirogane Blue Pond Parking' },
      { label: '白须瀑布', query: 'Shirahige Waterfall' },
      { label: '四季彩之丘', query: 'Shikisai no Oka' },
      { label: '富田农场', query: 'Farm Tomita' },
      { label: '精灵露台', query: 'Ningle Terrace' },
    ],
    reminders: ['这是最长车程日，唯一司机必须安排中途休息', '诺ロッコ号和羊驼在四季彩之丘', '23:00 前回到札幌为目标'],
  },
  {
    day: 6,
    date: '2026-08-28',
    weekday: '周五',
    title: '小樽海陆探险',
    route: '札幌 → 龙宫 Cruise → 堺町通 → 小型场馆 → 小樽运河',
    summary: '上午出海，下午做亲子任务，傍晚在运河收尾。',
    lodging: '札幌市区公寓',
    fallback: '海况不佳取消 Cruise，改为小樽博物馆、堺町通和运河慢游。',
    accent: '#2d7892',
    highlights: ['Blue Cave Cruise', '堺町通任务卡', '小型场馆', '小樽运河'],
    navigation: [
      { label: '龙宫 Cruise', query: 'Ryugu Cruise Otaru' },
      { label: '堺町通', query: 'Sakaimachi Street Otaru' },
      { label: '彩绘玻璃美术馆', query: 'Stained Glass Museum Otaru' },
      { label: '手宫线遗址', query: 'Former Temiya Line Otaru' },
      { label: '小樽运河', query: 'Otaru Canal' },
    ],
    reminders: ['提前吃晕船药并穿防风防水外套', '船班目标 10:30', '博物馆闭馆前预留完整参观时间'],
  },
  {
    day: 7,
    date: '2026-08-29',
    weekday: '周六',
    title: '北海道 Greenland',
    route: '札幌 → Greenland → 大地のテラス → 札幌',
    summary: '最后一个完整游玩日，以游乐园和当地食材晚餐收官。',
    lodging: '札幌市区公寓',
    fallback: '持续大雨时改札幌室内收尾；若大地のテラス无法确认晚餐，则切换 Nintendo POP-UP 方案。',
    accent: '#c26b2b',
    highlights: ['Greenland', '草坪野餐', '大地のテラス', '最后采购'],
    navigation: [
      { label: '北海道 Greenland', query: 'Hokkaido Greenland' },
      { label: '大地のテラス', query: '大地のテラス 岩見沢' },
      { label: '札幌站', query: 'Sapporo Station' },
    ],
    reminders: ['早餐和野餐食物提前准备', '提前确认并预约大地のテラス 18:00 晚餐', '晚上整理行李与次日返程物品'],
  },
  {
    day: 8,
    date: '2026-08-30',
    weekday: '周日',
    title: '返程日',
    route: '札幌 → 还车 → 新千岁机场 → 上海',
    summary: '早餐后整理退房，完成还车与机场最后采购。',
    lodging: '返程',
    fallback: '遇交通或还车排队时，直接压缩机场购物时间。',
    accent: '#59616b',
    highlights: ['退房检查', '还车补油', '机场购物', '返沪'],
    navigation: [
      { label: '新千岁机场', query: 'New Chitose Airport' },
      { label: '机场租车还车', query: 'New Chitose Airport Rent a Car Return' },
    ],
    reminders: ['前一晚完成大部分打包', '确认油种和满油还车规则', '护照与登机资料随身携带'],
  },
]

const getText = (row: Array<SourceCell | null>, index: number) => row[index]?.text.trim() ?? ''

const getLinks = (row: Array<SourceCell | null>) =>
  row
    .slice(6, 8)
    .filter((cell): cell is SourceCell => Boolean(cell?.url))
    .map((cell, index) => ({
      label: cell.text.replace(/^https?:\/\/\S+/i, '').trim() || `资料 ${index + 1}`,
      url: cell.url!,
    }))

const getTitle = (value: string) => {
  const cleaned = value.replace(/【([^】]+)】/g, '$1').replace(/\s+/g, ' ').trim()
  return cleaned.split(/[（(]/)[0].trim() || '行程安排'
}

const finalTimelineCorrections: Record<number, Record<string, string>> = {
  6: {
    '14:00~15:00': '【堺町通纯观光】【亲子任务卡】音乐盒堂、LeTAO、北一硝子',
    '15:00~16:00': '【堺町通亲子任务】【小店】16:00前结束主街段',
    '16:00~17:00': '【小型场馆】彩绘玻璃美术馆或金融资料馆二选一',
    '17:00~18:00': '【手宫线遗址】【小樽运河】仓库群、傍晚拍照',
  },
  7: {
    '17:00~18:00': '【离园】【大地のテラス】红色电车旁休息拍照',
    '18:00~19:00': '【大地のテラス晚餐】需提前确认开放并预约18:00',
    '19:00~20:00': '【晚餐】【返回札幌】',
    '20:00~21:00': '【狸小路】【采购】MEGA唐吉诃德购买DAY8早餐',
  },
}

const toCny = (value: string) => {
  const jpy = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(jpy) && jpy > 0 ? Math.round(jpy * 0.0415).toString() : ''
}

const buildTimeline = () => {
  const timelines = new Map<number, TimelineItem[]>()
  let currentDay = 0

  ;(sheetData.rows as Array<Array<SourceCell | null>>).forEach((row, rowIndex) => {
    const marker = getText(row, 0)
    const dayMatch = marker.match(/^DAY([1-8])/)
    if (dayMatch) currentDay = Number(dayMatch[1])
    if (!currentDay) return

    const time = getText(row, 1)
    const rawDetail = getText(row, 2)
    const detail = finalTimelineCorrections[currentDay]?.[time] ?? rawDetail
    if (!time || !detail) return

    const tags = [...detail.matchAll(/【([^】]+)】/g)].map((match) => match[1])
    const item: TimelineItem = {
      id: `day-${currentDay}-row-${rowIndex}`,
      time,
      title: getTitle(detail),
      detail,
      tags,
      dad: getText(row, 3),
      mom: getText(row, 4),
      kids: getText(row, 5),
      links: getLinks(row),
      costJpy: getText(row, 8),
      costCny: toCny(getText(row, 8)),
      isRest: /睡觉|洗漱|整理/.test(detail) && !/出发|景点|游乐/.test(detail),
    }

    timelines.set(currentDay, [...(timelines.get(currentDay) ?? []), item])
  })

  return timelines
}

const timelines = buildTimeline()

export const tripDays: DayPlan[] = dayMeta.map((meta) => ({
  ...meta,
  timeline: timelines.get(meta.day) ?? [],
}))

export const tripBasics = {
  title: '北海道亲子自驾',
  dateRange: '2026.08.23 — 08.30',
  party: '4 位成人 · 2 个孩子 · 1 位司机',
  source: sheetData.source,
  sourceUpdatedAt: sheetData.updatedAt,
}

export const guideSections = [
  {
    id: 'bookings',
    title: '预约与门票',
    intro: '出发前优先确认，现场只看结果。',
    items: [
      { title: '留寿都一日券', detail: '建议提前网上购买，包含游乐园、羊蹄缆车等；现场购票更贵。', badge: '待购票' },
      { title: '龙宫 Blue Cave', detail: '目标 8 月 28 日 10:30 船班；出发前再次确认海况与集合时间。', badge: '重点确认' },
      { title: 'GAjA すすきの店', detail: 'DAY4 札幌晚餐首选，按在线文档中的预约状态执行。', badge: '已安排' },
      { title: '洞爷湖晚餐', detail: '周二删除牛助与 mog mog；首选アペコロ，KARZZ、OMOYA依次备选。', badge: '已纠正' },
      { title: '大地のテラス', detail: 'DAY7 主方案需提前确认 8 月 29 日晚餐开放，并预约 18:00。', badge: '重点确认' },
    ],
  },
  {
    id: 'budget',
    title: '预算速查',
    intro: '以两家六人合计估算，不含机票与住宿。',
    items: [
      { title: '7 天吃＋玩', detail: '约 ¥360,000–393,000 日元；建议两家共准备约人民币 16,000 元。', badge: '两家合计' },
      { title: '车辆', detail: '租车已知约人民币 6,000 元；加油、高速、停车后两家合计约 7,750–8,400 元。', badge: '含租车' },
      { title: '购物', detail: '建议每家预留人民币 3,000–5,000 元，常规档按 4,000 元。', badge: '每家' },
      { title: '现金', detail: '每家准备约 30,000–50,000 日元现金，并多备 1,000 日元纸币。', badge: '每家' },
      { title: '每家总预算', detail: '最终建议约人民币 18,000 元，含吃、玩、租车交通及约 5,000 元购物，不含机票住宿。', badge: '最终口径' },
    ],
  },
  {
    id: 'packing',
    title: '行李清单',
    intro: '勾选状态只保存在当前手机。',
    checklist: [
      '护照与驾驶证件',
      'VISA 信用卡至少两张',
      '日元现金与零钱袋',
      '手机、充电器和充电宝',
      'eSIM 或日本流量卡',
      '防风外套与儿童雨衣',
      '舒适运动鞋与备用鞋',
      '儿童常用药与晕车晕船药',
      '车载充电器与手机支架',
      '水杯、湿巾、垃圾袋',
      '儿童任务卡与安抚玩具',
      '离线地图与停车场截图',
    ],
  },
  {
    id: 'emergency',
    title: '应急与驾驶',
    intro: '先保证安全，再删减项目。',
    items: [
      { title: '日本紧急电话', detail: '警察 110；急救与消防 119。', badge: '离线可看' },
      { title: '唯一司机', detail: '全程仅合法证件齐全的爸爸驾驶；DAY5 必须安排中途休息，疲劳时直接删减景点。', badge: '安全优先' },
      { title: '租车事故', detail: '先确保人员安全，再联系警方与租车公司；不要自行私了。', badge: '重要' },
      { title: '儿童走失', detail: '孩子随身携带家长联系卡，约定原地等待，不单独寻找。', badge: '亲子' },
    ],
  },
] as const

export const sourceLink =
  'https://docs.qq.com/sheet/DU1dKV3hzanBDSmJj?opennew=1&tab=ukregn'

export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
