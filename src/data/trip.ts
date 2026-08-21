import sheetData from './sheetData.json'

export type SourceCell = {
  text: string
  url: string | null
}

export type FillGuideStep = {
  id: string
  field: string
  how: string
  /** option = 门牌备选；phrase = 可复制话术；task = 必要任务可勾选。默认 task。 */
  kind?: 'option' | 'task' | 'phrase'
  /** 挂在该备选旁的菜单 / 地图等链接（优先于时段底部链接展示） */
  links?: { label: string; url: string }[]
}

export type TimelineMaterial = {
  title: string
  body: string
  steps?: FillGuideStep[]
  /** 纯展示清单，不可勾选、不可点选 */
  list?: string[]
  /** 挂在整块资料标题下的链接（如预约凭证） */
  links?: { label: string; url: string }[]
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
  materials: TimelineMaterial[]
  costJpy: string
  costCny: string
  isRest: boolean
}

const coverUrl = (file: string) => `${import.meta.env.BASE_URL}covers/${file}`
export const docUrl = (file: string) => `${import.meta.env.BASE_URL}docs/${file}`

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
  cover: string
  coverLabel: string
  highlights: string[]
  navigation: { label: string; query: string }[]
  reminders: string[]
  /** Day-level pinned docs (e.g. guide script), shown on home live card. */
  pinnedDocs?: { label: string; url: string }[]
}

export const HOME_COVER = coverUrl('furano-lavender-cover.jpg')

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
    accent: '#6b4d78',
    cover: coverUrl('day1-shikotsu.jpg'),
    coverLabel: '支笏湖',
    highlights: ['机场取车', '支笏湖观光船', '山线铁桥', 'Seicomart 采购'],
    navigation: [
      { label: '新千岁机场 B 停车场', query: '新千歳空港B駐車場' },
      { label: '支笏湖收费停车场', query: 'Lake Shikotsu paid parking lot' },
      { label: '翠葉 Rusutsu', query: 'Suiyo Rusutsu' },
      { label: '源べえ 留寿都店', query: '源べえ 留寿都店' },
      { label: 'Seicomart Rusutsu', query: 'Seicomart Rusutsu' },
    ],
    pinnedDocs: [
      { label: 'DAY1 导游发言稿', url: docUrl('day1-guide-script.pdf') },
    ],
    reminders: [
      '落地后先完成入境、行李和取车',
      '出发导航：Lake Shikotsu paid parking lot',
      '争取 15:00 到支笏湖；观光船末班 17:00，晚到先砍船',
      '晚间采购次日早餐与饮用水',
    ],
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
    cover: coverUrl('day2-rusutsu.jpg'),
    coverLabel: '留寿都 · 羊蹄山',
    highlights: ['游乐园', '羊蹄山缆车', '亲子项目', '园区晚餐'],
    navigation: [
      { label: '留寿都度假村', query: 'Rusutsu Resort' },
    ],
    reminders: ['提前网上购票比现场更省', '午餐按所在区域就近解决', '游乐园不建议撑伞，带雨衣', '晚饭前后预订 DAY3 Oktoberfest 早餐'],
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
    cover: coverUrl('day3-toya.jpg'),
    coverLabel: '洞爷湖',
    highlights: ['有珠山缆车', 'Lake Hill Farm', '火山科学馆', '洞爷湖烟花'],
    navigation: [
      { label: '有珠山停车场', query: 'Usuzan Showashinzan Yuryo Parking Lot' },
      { label: 'Lake Hill Farm 停车场', query: 'Lake Hill Farm Parking' },
      { label: '洞爷湖温泉停车场', query: 'Toyako Onsen Parking' },
      { label: '翠葉 Rusutsu', query: 'Suiyo Rusutsu' },
    ],
    pinnedDocs: [
      { label: 'DAY3 导游发言稿', url: docUrl('day3-guide-script.pdf') },
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
    cover: coverUrl('day4-shiroi-koibito.jpg'),
    coverLabel: '白色恋人公园',
    highlights: ['定山溪散步', '温泉街午餐', '白色恋人公园', '狸小路'],
    navigation: [
      { label: '定山溪游客中心', query: 'Jozankei Tourist Information Center' },
      { label: '白色恋人公园', query: 'Shiroi Koibito Park Parking' },
      { label: '札幌市区公寓（下午回酒店）', query: '札幌市区公寓' },
      { label: '晚饭停车 · トラストパークすすきの5・2', query: 'トラストパーク札幌すすきの5・2' },
    ],
    pinnedDocs: [
      { label: 'DAY4 定山溪旅游指南', url: docUrl('day4-guide-script.pdf') },
      { label: '河童寻宝中文亲子版', url: docUrl('jozankei-kappa-rally-zh.pdf') },
      { label: 'GAjA 预约凭证', url: docUrl('gaja-susukino-reservation.pdf') },
      { label: 'GAjA 烤肉自助菜单摘要', url: docUrl('gaja-susukino-menu-zh.pdf') },
    ],
    reminders: [
      '出发前完成垃圾分类和退房检查',
      '白色恋人公园预留约 3 小时',
      '晚餐 GAjA 已预约 18:45（#30633 · プレミア ×6）；停车すすきの5・2',
      '河童寻宝：孩子可玩；题板多为日语，大人用翻译拍题即可',
    ],
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
    accent: '#8b6aab',
    cover: coverUrl('day5-furano.jpg'),
    coverLabel: '美瑛 · 富良野',
    highlights: ['青池', '白须瀑布', '四季彩之丘', '富田农场', '森林精灵露台'],
    navigation: [
      { label: '青池停车场', query: 'Shirogane Blue Pond Parking' },
      { label: '白须瀑布', query: 'Shirahige Waterfall Parking' },
      { label: '四季彩之丘', query: 'Shikisai no Oka Parking' },
      { label: '富田农场', query: 'Farm Tomita Parking' },
      { label: '精灵露台', query: 'Ningle Terrace Parking' },
    ],
    pinnedDocs: [
      { label: 'DAY5 导游发言稿', url: docUrl('day5-guide-script.pdf') },
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
    accent: '#5a5d9a',
    cover: coverUrl('day6-otaru.jpg'),
    coverLabel: '小樽运河',
    highlights: ['Blue Cave Cruise', '堺町通任务卡', '小型场馆', '小樽运河'],
    navigation: [
      { label: '龙宫 Cruise', query: 'Ryugu Cruise Otaru' },
      { label: '小樽运河', query: 'Otaru Canal Parking' },
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
    cover: coverUrl('day7-greenland.jpg'),
    coverLabel: '北海道 Greenland',
    highlights: ['Greenland', '草坪野餐', '大地のテラス', '最后采购'],
    navigation: [
      { label: '北海道 Greenland', query: 'Hokkaido Greenland Parking' },
      { label: '大地のテラス', query: '大地のテラス 岩見沢' },
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
    accent: '#5c4d68',
    cover: coverUrl('day8-airport.jpg'),
    coverLabel: '新千岁机场',
    highlights: ['退房检查', '还车补油', '机场购物', '返沪'],
    navigation: [
      { label: '机场还车', query: 'New Chitose Airport Rent a Car Return' },
    ],
    reminders: ['前一晚完成大部分打包', '确认油种和满油还车规则', '护照与登机资料随身携带'],
  },
]

const getText = (row: Array<SourceCell | null>, index: number) => row[index]?.text.trim() ?? ''

const isMostlyUrl = (text: string) => {
  const cleaned = text.trim()
  if (!cleaned) return false
  if (/^https?:\/\/\S+$/i.test(cleaned)) return true
  const withoutUrls = cleaned.replace(/https?:\/\/\S+/gi, '').trim()
  return withoutUrls.length < 8
}

const guessLinkLabel = (cell: SourceCell, index: number, context: string) => {
  const leftover = cell.text.replace(/https?:\/\/\S+/gi, '').trim()
  if (leftover) return leftover
  if (/入境|过关|Visit Japan|入境卡/i.test(context)) return '入境填写参考'
  if (/船|cruise|龙宫/i.test(context)) return '船票 / 游船资料'
  if (/rusutsu|留寿都|游乐/i.test(context)) return '留寿都游乐资料'
  if (/lake.?hill|牧场/i.test(context)) return '牧场资料'
  if (/洞爷|烟花|laketoya/i.test(context)) return '洞爷湖资料'
  if (/定山溪|jozankei|河童/i.test(context)) return '定山溪活动资料'
  if (/gaja|烤肉|预约/i.test(context)) return '餐厅预约'
  return `资料 ${index + 1}`
}

const getLinks = (row: Array<SourceCell | null>, context: string) =>
  row
    .slice(6, 8)
    .filter((cell): cell is SourceCell => Boolean(cell?.url))
    .map((cell, index) => ({
      label: guessLinkLabel(cell, index, context),
      url: cell.url!,
    }))

const titleFromMaterialBody = (body: string, index: number) => {
  const firstLine = body.split(/\n/).map((line) => line.trim()).find(Boolean) ?? ''
  if (/攻略|清单|注意|填写|步骤/.test(firstLine) && firstLine.length <= 28) return firstLine
  if (firstLine.startsWith('【') && firstLine.length <= 24) {
    return firstLine.replace(/【|】/g, '').split(/[·+／/]/)[0].trim() || `现场资料 ${index + 1}`
  }
  return `现场资料 ${index + 1}`
}

/** 当天停车点已在顶部 ParkingBar，表格「停车点」列不要再变成现场资料。 */
const parkingPlaceNames = new Set(
  dayMeta.flatMap((day) => day.navigation.flatMap((nav) => [nav.label.trim(), nav.query.trim()])),
)

const isParkingPlaceText = (text: string) => {
  const cleaned = text.trim()
  if (!cleaned || cleaned === '停车点：') return true
  if (parkingPlaceNames.has(cleaned)) return true
  return /停车场|parking lot|駐車場/i.test(cleaned) && cleaned.length < 64
}

const getMaterials = (row: Array<SourceCell | null>): TimelineMaterial[] =>
  row
    .slice(6, 8)
    .filter((cell): cell is SourceCell => {
      if (!cell) return false
      const text = cell.text.trim()
      if (!text || isParkingPlaceText(text)) return false
      if (cell.url && isMostlyUrl(text)) return false
      if (cell.url) {
        const leftover = text.replace(/https?:\/\/\S+/gi, '').trim()
        if (isParkingPlaceText(leftover)) return false
        return leftover.length >= 12
      }
      return text.length >= 8 && !/^https?:\/\/\S+$/i.test(text)
    })
    .map((cell, index) => {
      const body = cell.url
        ? cell.text.replace(/https?:\/\/\S+/gi, '').replace(/\n{3,}/g, '\n\n').trim()
        : cell.text.trim()
      return {
        title: titleFromMaterialBody(body, index),
        body,
      }
    })
    .filter((material) => material.body.length >= 8 && !isParkingPlaceText(material.body))

const getTitle = (value: string) => {
  const cleaned = value.replace(/【([^】]+)】/g, '$1').replace(/\s+/g, ' ').trim()
  return cleaned.split(/[（(]/)[0].trim() || '行程安排'
}

const arrivalCustomsGuide: TimelineMaterial = {
  title: '① 新千岁出关',
  body: '目标约 12:30 抵达。下飞机后直奔关口，尽量不要先去厕所；现场通常有工作人员分流加速。',
  steps: [
    { id: 'go-gate', field: '下机后', how: '跟着“入国审查 / Immigration”指示直奔关口，先过关再处理其他事。' },
    {
      id: 'qr-ready',
      field: '电子二维码',
      how: '提前一天按 Visit Japan Web / 在线指引填好，落地直接出示，不要现场现填。',
    },
    {
      id: 'clearance',
      field: '过关三步',
      how: '出示护照 → 扫描二维码 → 录入双手指纹。保持队形，孩子跟在大人后面。',
    },
    {
      id: 'luggage',
      field: '取行李',
      how: '过关后到国际到达行李转盘取托运行李，再汇合去接驳取车。',
    },
  ],
}

const jnetShuttleGuide: TimelineMaterial = {
  title: '② J-Net 接驳取车',
  body: '关键：不是在航站楼内取车。没有航站楼柜台，也不会在航站楼门口交车；需坐免费接驳车约 10–15 分钟到营业所。',
  steps: [
    { id: 'exit', field: '出楼', how: '完成入境与取行李后，从机场 1 楼到达层出楼。' },
    {
      id: 'walk',
      field: '步行路线',
      how: '出楼后沿巴士/出租车道向左走，经过“1 番巴士站”，继续走到交番（小警察亭）附近。',
    },
    {
      id: 'stop',
      field: '上车点',
      how: '在标有“许可车乘降所”的区域等候 Jネットレンタカー / J-Net Rent-a-Car 接驳车。',
    },
    {
      id: 'bus',
      field: '班次',
      how: '约每 15 分钟一班，通常无需预约。上车后到营业所办手续取车。',
    },
    {
      id: 'call',
      field: '找不到就打电话',
      how: '拨打 0120-302-554；语音提示后按 1，听接驳上车点说明。',
    },
  ],
}

const parkingMeetupGuide: TimelineMaterial = {
  title: '③ B 停车场汇合口令',
  body: '取车爸爸开回机场后，在新千岁空港 B 停车场汇合。整片 B 停车场比单独标某个立体楼更稳；目标是靠近国际线航站楼一侧。',
  steps: [
    {
      id: 'nav',
      field: '导航目标',
      how: '导航搜“新千岁空港B停车场 / New Chitose Airport Parking Lot B”，进 B 停车场即可。',
    },
    {
      id: 'park',
      field: '取车爸爸怎么停',
      how: '进 B 停车场后尽量停地图左侧、国际线侧，靠近 C67 / C69 方向的空位。',
    },
    {
      id: 'report',
      field: '停好立刻发消息',
      how: '发送：楼层 + 分区 + 柱号 + 车辆照片。没有柱号就发最近标识牌照片。',
    },
    {
      id: 'wait',
      field: '行李组怎么等',
      how: '先在国际到达大厅等消息；收到柱号和照片后再推行李出去，避免在停车场瞎找。',
    },
    {
      id: 'passcode',
      field: '全员口令',
      how: 'B停车场，尽量停国际线侧、靠C67/C69方向；停好后发送柱号。',
    },
  ],
}

const airportFoodGuide: TimelineMaterial = {
  title: '机场午饭 / 采购菜单',
  body: '取车期间按喜好点，不是任务。先吃再买明早，会合优先；支笏湖只当小吃，不把正餐押在湖边。',
  steps: [
    { id: 'kamaboko', field: 'かま栄', how: '鱼浆包面包后再油炸，咸香顶饿，适合当正餐主食。', kind: 'option' },
    { id: 'valleys', field: '十勝VALLEYs', how: '芝士包＋玉米可乐饼，带娃分着吃方便。', kind: 'option' },
    { id: 'kinotoya', field: 'Kinotoya / きのとや', how: '现烤芝士挞，热的最好吃，可顺手买冷藏带走。', kind: 'option' },
    { id: 'calbee', field: 'Calbee+', how: '现做薯条，孩子友好；别买太多以免湖边吃不下。', kind: 'option' },
    { id: 'kitakaro', field: '北菓楼', how: '铜锣烧、泡芙，礼盒或现吃都可。', kind: 'option' },
    { id: 'milkcastella', field: '北海道牛乳カステラ', how: '瑞士卷、蛋糕，适合当晚或次日早餐甜品。', kind: 'option' },
    { id: 'snowcheese', field: 'Snow Cheese', how: '网红甜品，排队的话先看时间，取车会合优先。', kind: 'option' },
    { id: 'letao', field: 'LeTAO New Chitose Airport', how: '小樽本店系列在机场也能买到，芝士蛋糕可冷藏。', kind: 'option' },
    { id: 'pasco', field: '买早饭 · Pasco Hokkaido Premium', how: '北海道牛奶面包、红豆面包、果酱，明早酒店热一下就能吃。', kind: 'option' },
    {
      id: 'supermarket',
      field: '买早饭 · 超市补货',
      how: '鸡蛋、香肠、牛奶、酸奶、水果、芝士切片、水、方便面、即冲汤。不够再买，避免重复。',
      kind: 'option',
    },
  ],
}

const shikotsuBoatGuide: TimelineMaterial = {
  title: '观光船 · 末班 17:00',
  body: '水中观光船约 30 分钟。2026 季末班 17:00；到湖先问下一班。赶不上或风大，改天鹅船或湖边走走。',
  links: [{ label: '观光船官网', url: 'https://shikotsu-ship.co.jp/' }],
}

const shikotsuSnackGuide: TimelineMaterial = {
  title: '景点小吃菜单 · 支笏湖',
  body: '湖边不当正餐，走到哪买到哪，按喜好点。',
  steps: [
    { id: 'hekisu', field: '北のうまいもん店 碧水', how: '扇贝玉米烧、烤鱿鱼，热食小吃。', kind: 'option' },
    { id: 'showa', field: '昭和物産', how: '炸物、炭火烤，和碧水二选一或各买一点即可。', kind: 'option' },
    { id: 'patissier', field: 'スイーツショップ パティシエ・ラボ（买早饭）', how: '甜点店，可顺手买明早甜品/面包类带走。', kind: 'option' },
  ],
}

const day2OutingSnackGuide: TimelineMaterial = {
  title: '次日出行补给 · 便利店采购',
  body: 'DAY2 游乐园要用的补给，今晚在 Seicomart 买好，明早少出门。',
  steps: [
    { id: 'water', field: '饮用水 500ml ×4～6', how: '全天够喝优先。' },
    { id: 'sports', field: '运动饮料 ×2～4', how: '游乐出汗后补电解质。' },
    { id: 'onigiri', field: '小饭团 ×2', how: '路上或园内垫肚子。' },
    { id: 'bread', field: '独立包装面包 ×2', how: '不易坏，孩子也好分。' },
    { id: 'banana', field: '香蕉 ×2', how: '快速补充能量。' },
    { id: 'jelly', field: '能量果冻 ×2', how: '排队时一口补糖。' },
    { id: 'kids-snack', field: '两个孩子各一小包零食', how: '按孩子口味选，别买太多。' },
    { id: 'wipes', field: '湿巾和垃圾袋', how: '车上和园内清洁备用。' },
  ],
}

const genbeeMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('genbee-menu-zh.pdf'),
}

const kakashiMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('kakashi-menu-zh.pdf'),
}

const ichiMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('jozankei-ichi-menu-zh.pdf'),
}

const harurannaMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('jozankei-haruranna-menu-zh.pdf'),
}

const konnoMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('jozankei-konno-menu-zh.pdf'),
}

const gajaMenuLink = {
  label: '中文菜单（PDF）',
  url: docUrl('gaja-susukino-menu-zh.pdf'),
}

const gajaReservationLink = {
  label: '预约凭证（PDF）',
  url: docUrl('gaja-susukino-reservation.pdf'),
}

const day1DinnerGuide: TimelineMaterial = {
  title: '留寿都晚餐菜单 · 源べえ',
  body: '开车回酒店时就可打开对照，提前想好点什么。今晚首选源べえ。',
  steps: [
    {
      id: 'genbee',
      field: '1 源べえ 留寿都店（首选）',
      how: '居酒屋；对照中文菜单点餐。',
      kind: 'option',
      links: [
        genbeeMenuLink,
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E6%BA%90%E3%81%B9%E3%81%88%20%E7%95%99%E5%AF%BF%E9%83%BD%E5%BA%97',
        },
      ],
    },
  ],
}

const day2DinnerGuide: TimelineMaterial = {
  title: '园区晚餐备选 · 顺手订明早',
  body: '1～3 为晚饭可选餐厅；第 4 项为必要问询任务：务必预订 DAY3 早餐 Oktoberfest。',
  steps: [
    {
      id: 'kakashi',
      field: '1 居酒屋かかし Kakashi（首选）',
      how: '点中文菜单点餐。',
      kind: 'option',
      links: [
        kakashiMenuLink,
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E5%B1%85%E9%85%92%E5%B1%8B%E3%81%8B%E3%81%8B%E3%81%97%20Kakashi%20Rusutsu',
        },
      ],
    },
    {
      id: 'cricket',
      field: '2 Pub Cricket（备选）',
      how: 'Kakashi 满座或排队太久时改这里。',
      kind: 'option',
      links: [{ label: '地图', url: 'https://maps.google.com/?q=Pub%20Cricket%20Rusutsu' }],
    },
    {
      id: 'moku',
      field: '3 Mokumokuya（备选）',
      how: '第二备选，园区内就近即可。',
      kind: 'option',
      links: [{ label: '地图', url: 'https://maps.google.com/?q=Mokumokuya%20Rusutsu' }],
    },
    {
      id: 'book-oktoberfest',
      field: '预订明早早餐 · Oktoberfest',
      how: 'DAY3 早餐在 Oktoberfest；今晚务必完成预订/确认，避免明早吃不上。',
      kind: 'task',
    },
  ],
}

const lakeHillTeaGuide: TimelineMaterial = {
  title: '下午茶清单 · Lake Hill Farm',
  body: '牧场轻食与乳制品甜点，按喜好点即可，不用全买。',
  steps: [
    { id: 'curry', field: '村一番咖喱', how: '热食主食选项。', kind: 'option' },
    { id: 'pizza', field: '披萨等轻食', how: '分着吃方便。', kind: 'option' },
    { id: 'gelato', field: '杰拉托（约 20 种口味）', how: '必点；可多口味分装。', kind: 'option' },
    { id: 'milk', field: '牛奶', how: '牧场鲜奶。', kind: 'option' },
    { id: 'icecream', field: '冰淇淋', how: '和杰拉托二选一或都尝尝。', kind: 'option' },
    { id: 'coffee', field: '咖啡', how: '配甜点。', kind: 'option' },
    { id: 'pudding', field: '布丁', how: '乳制品甜点。', kind: 'option' },
    { id: 'puff', field: '泡芙及其他乳制品甜点', how: '顺手带给孩子。', kind: 'option' },
    { id: 'souvenir', field: '奶酪、果酱和烘焙纪念品', how: '可带走，不必一次买齐。', kind: 'option' },
  ],
}

const toyaBrowseShopsGuide: TimelineMaterial = {
  title: '可以逛的店',
  body: '湖畔散步时顺路可进，括号内为关门参考时间。',
  steps: [
    { id: 'wakasaimo', field: 'わかさいも本舗', how: '约 18:00 关门，优先去。', kind: 'option' },
    { id: 'echigoya', field: '洞爷湖越后屋', how: '约 19:30 关门。', kind: 'option' },
    { id: 'shibataya', field: '柴田屋', how: '约 20:00 关门。', kind: 'option' },
  ],
}

const toyaDinnerGuide: TimelineMaterial = {
  title: '洞爷湖晚餐备选',
  body: '首选 Restaurant & Flowers KARZZ；满座或排队再改去下面备选。',
  steps: [
    {
      id: 'karzz',
      field: '1 Restaurant & Flowers KARZZ（首选）',
      how: '今晚最推荐。',
      kind: 'option',
      links: [
        {
          label: '地图',
          url: 'https://maps.google.com/?q=Restaurant%20%26%20Flowers%20KARZZ%20Toyako',
        },
      ],
    },
    {
      id: 'apecolo',
      field: '2 炭火ダイニング アペコロ（备选）',
      how: 'KARZZ 满/排队时改这里。',
      kind: 'option',
      links: [
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E7%82%AD%E7%81%AB%E3%83%80%E3%82%A4%E3%83%8B%E3%83%B3%E3%82%B0%20%E3%82%A2%E3%83%9A%E3%82%B3%E3%83%AD',
        },
      ],
    },
    {
      id: 'fuji',
      field: '3 洋食屋 Fuji（备选）',
      how: '备选。',
      kind: 'option',
      links: [
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E6%B4%8B%E9%A3%9F%E5%B1%8BFuji%20%E6%B4%9E%E7%88%BA%E6%B9%96',
        },
      ],
    },
    {
      id: 'kinjo',
      field: '4 焼肉 金城（备选）',
      how: '备选。',
      kind: 'option',
      links: [
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E7%84%BC%E8%82%89%20%E9%87%91%E5%9F%8E%20%E6%B4%9E%E7%88%BA',
        },
      ],
    },
    {
      id: 'omoya',
      field: '5 OMOYA（备选）',
      how: '备选。',
      kind: 'option',
      links: [{ label: '地图', url: 'https://maps.google.com/?q=OMOYA%20Toyako' }],
    },
  ],
}

const jozankeiKidsGuide: TimelineMaterial = {
  title: '河童寻宝 · 家长帮忙清单（约 2 小时）',
  body:
    '约 10:30–12:30。孩子不用会日语；题板多为日文，大人相机翻译即可。按顺序勾选推进，别跳过盖章和三个提示点。',
  steps: [
    {
      id: 'info-center',
      field: '① 停车→观光案内所领活动册',
      how: '到定山溪后第一站先领纸质册；问清当天是否有施工绕行。',
    },
    {
      id: 'ask-staff',
      field: '② 出示日文话术说明要参加',
      how: '把下方「话术1」给工作人员看；再问二见定山之道能否做完全部题（话术2）。',
    },
    {
      id: 'stamp-first',
      field: '③ 先消费盖 1 个章（抽奖资格）',
      how: '冰淇淋/小食/饮料即可。出示话术3请店员盖章；没章不能抽奖。',
    },
    {
      id: 'phone-translate',
      field: '④ 打开手机相机翻译（日→中）',
      how: 'Google 翻译相机对准题板；只框题目、避免反光。',
    },
    {
      id: 'split-roles',
      field: '⑤ 家庭分工到位',
      how: '大人A：翻译题板；大人B：地图+计时+拍照；7岁：记答案；5岁：找河童像。',
    },
    {
      id: 'each-kappa',
      field: '⑥ 每到一处河童像',
      how: '拍雕像全景 + 题板特写；对照活动册河童名字，把答案写进圆圈。',
    },
    {
      id: 'three-hints',
      field: '⑦ 三个提示点必去',
      how: '河童大王（二见公园）/ 定山源泉公园 / 岩户观音堂。终题常相关，别省。',
    },
    {
      id: 'finish-draw',
      field: '⑧ 全部完成后回案内所终题抽奖',
      how: '把答案填进红框，交给工作人员抽奖。抽奖窗口 9:00–17:00；午餐前尽量做完。',
    },
    {
      id: 'jozan-rally',
      field:
        '中国から来ました。7歳と5歳の子どもと、かっぱんラリーに参加したいです。中国語版はありますか？簡単に遊び方を教えてください。',
      how: '话术1：我们来自中国，想带7岁和5岁孩子参加河童寻宝。有中文版吗？请简单说明玩法。',
      kind: 'phrase',
    },
    {
      id: 'jozan-trail',
      field: '二見定山の道を歩きながら、問題を全部解けますか？',
      how: '话术2：沿二见定山之道徒步，能做完全部题目吗？',
      kind: 'phrase',
    },
    {
      id: 'jozan-stamp',
      field: 'かっぱんラリーのスタンプをお願いします。',
      how: '话术3：请帮我盖河童寻宝的店铺印章。',
      kind: 'phrase',
    },
  ],
}

const jozankeiLunchGuide: TimelineMaterial = {
  title: '定山溪午餐备选',
  body: '首选 食堂いち；满座或排队再改下面备选。菜单在各店名旁（中文摘要，价目以店内为准）。',
  steps: [
    {
      id: 'ichi',
      field: '1 食堂いち（首选）',
      how: '炭火定食；11:00–15:00。',
      kind: 'option',
      links: [
        ichiMenuLink,
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E9%A3%9F%E5%A0%82%E3%81%84%E3%81%A1%20%E5%AE%9A%E5%B1%B1%E6%BA%AA',
        },
      ],
    },
    {
      id: 'haruranna',
      field: '2 埜ノ山キッチン はるらんな（备选）',
      how: 'いち 满/排队时改这里；炖菜／轻食。',
      kind: 'option',
      links: [
        harurannaMenuLink,
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E5%9F%9E%E3%83%8E%E5%B1%B1%E3%82%AD%E3%83%83%E3%83%81%E3%83%B3%20%E3%81%AF%E3%82%8B%E3%82%89%E3%82%93%E3%81%AA',
        },
      ],
    },
    {
      id: 'konno',
      field: '3 食堂こんの（40年拉面馆 · 备选）',
      how: '第二备选；盐／酱油／味噌拉面。',
      kind: 'option',
      links: [
        konnoMenuLink,
        {
          label: '地图',
          url: 'https://maps.google.com/?q=%E9%A3%9F%E5%A0%82%E3%81%93%E3%82%93%E3%81%AE%20%E5%AE%9A%E5%B1%B1%E6%BA%AA',
        },
      ],
    },
  ],
}

const day4DinnerGuide: TimelineMaterial = {
  title: '【晚餐】',
  body: 'GAjA すすきの店（已预约 · 烤肉自助）\n2026-08-26（三）18:45 入店 → 20:45 离店\n6人 · プレミア食べ放題 ¥6,028/人 · 屏风隔间\n预约编号 #30633 · 姓名 CHEN ZHONG\n停车：トラストパークすすきの5・2\n入店出示预约凭证，或直接报编号。',
  links: [
    gajaReservationLink,
    gajaMenuLink,
    {
      label: '地图',
      url: 'https://maps.google.com/?q=GAjA%20%E3%81%99%E3%81%99%E3%81%8D%E3%81%AE%E5%BA%97',
    },
  ],
}

/** 晚饭后狸小路一带闲逛；纯 LIST，不可勾选 */
const day4NightBrowseGuide: TimelineMaterial = {
  title: '晚饭后可逛清单 · 狸小路',
  body: '约 19:00–21:00。先去早关门的；括号为关门参考。加推店可穿插，不必全逛。',
  list: [
    'DAIMARUFUJII CENTRAL（约 19:00）— 大丸藤井：文具／纸品／生活杂货很强，亲子优先冲文具楼层',
    'Standard Products moyuk（约 20:00）— moyuk 馆内百元风日用百货：收纳、厨房、小物，适合顺手补日用品',
    'モユク札幌ロフト（约 21:00）— LOFT：文具、化妆、手帐周边、小玩具杂货，孩子爱逛',
    'たぬきや — 狸小路4丁目大型北海道伴手礼：白色恋人／六花亭／Royce、限定角色周边、酒与杂货，免税',
    '#C-pla — 扭蛋／胶囊玩具专卖，孩子玩得久；硬币多备一点',
    '—— 狸小路加推（值得穿插）——',
    'こぶしや — 同街区大型伴手礼；限定甜品、地酒／啤酒、杂货也齐，和たぬきや可对比着买',
    'しらかば — 定番菓子伴手礼，常有折扣价，预算敏感时值得比价',
    '北菓楼 札幌本馆／附近店 — 三星奶油三明治、泡芙等现做甜点，可现吃也可带走',
    'ロイズ 巧克力店（狸小路周边）— 生巧克力／土豆片巧克力，排队不长时可顺手买',
    'ヴィレッジヴァンガード（若路过）— 怪味杂货书刊玩具，孩子爱翻；时间紧可跳过',
    'MEGA 唐吉诃德 狸小路店 — 药妆零食玩具一站购；吵且晚，想一次买齐再进',
  ],
}

const finalTimelineCorrections: Record<number, Record<string, string>> = {
  1: {
    '12:00~13:00':
      '【抵达】+【过关】+【取行李】+【接驳取车】\n12:30左右抵达→直奔关口→取行李→J-Net接驳→B停车场汇合',
    '13:00~14:00':
      '【租车】+【机场午饭菜单】\n按喜好选：かま栄 / 十勝VALLEYs / きのとや / Calbee+ / 北菓楼 / 牛乳カステラ / Snow Cheese / LeTAO；早饭买 Pasco',
    '14:00~15:00':
      '【会合】+【出发】→支笏湖\n约30公里 / 35分钟\n停车点：Lake Shikotsu paid parking lot',
    '15:00~16:00':
      '【景点2·支笏湖】\n争取15:00抵达；观光船末班17:00，晚到改天鹅船或湖边走走\n【观光船＋天鹅船】',
    '16:00~17:00':
      '【观光船＋天鹅船】+【商业街】\n观光船末班17:00，先问下一班再逛',
    '18:00~19:00':
      '【回家】开车约1小时 → 翠葉 Rusutsu\n车上可先打开源べえ菜单，到店直接点',
    '20:00~21:00': '【便利店采购】Seicomart Rusutsu\n买好 DAY2 游乐园补给（水、运动饮料、小食）',
  },
  3: {
    '18:00~19:00': '【逛纪念品】+【晚饭可开始】\n首选 KARZZ；备选アペコロ / Fuji / 金城 / OMOYA',
  },
  4: {
    '12:00~13:00': '【午餐】定山溪\n首选 食堂いち；备选 はるらんな / 食堂こんの',
    '10:00~11:00':
      '【河童寻宝】约 2 小时上半\n领册→盖章→找河童像答题；大人翻译题板，孩子找雕像记答案',
    '11:00~12:00':
      '【河童寻宝】约 2 小时下半\n三个提示点→回案内所终题抽奖；争取午餐前完成',
    '17:00~18:00': '【回家】回札幌公寓休整，准备出门晚饭',
    '18:00~19:00': '【晚餐】GAjA すすきの店（已预约）\n18:45 入店 · #30633 · プレミア ×6 · 屏风隔间',
    '19:00~20:00': '【饭后逛街】狸小路一带 · 按关门时间逛',
    '20:00~21:00': '【饭后逛街】继续逛店；文具／玩具可顺路看',
  },
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

const materialCorrections: Record<number, Record<string, TimelineMaterial[]>> = {
  1: {
    // 机上无网：入境卡自行按护照/住宿地址填写，不挂对照表与外链资料
    '8:00~12:00': [],
    '12:00~13:00': [arrivalCustomsGuide, jnetShuttleGuide, parkingMeetupGuide],
    '13:00~14:00': [airportFoodGuide],
    // 湖边：先看末班船，小吃当菜单
    '15:00~16:00': [shikotsuBoatGuide, shikotsuSnackGuide],
    '16:00~17:00': [shikotsuBoatGuide, shikotsuSnackGuide],
    // 晚饭菜单挂在回程车上，方便提前看
    '18:00~19:00': [day1DinnerGuide],
    '19:00~20:00': [day1DinnerGuide],
    // 便利店：把 DAY2 出行补给提前买好
    '20:00~21:00': [day2OutingSnackGuide],
  },
  2: {
    // 园区晚饭：首选 Kakashi，备选 Pub Cricket / Mokumokuya
    '17:00~18:00': [day2DinnerGuide],
    '18:00~19:00': [day2DinnerGuide],
  },
  3: {
    // Lake Hill：合并成一份下午茶清单，不勾选
    '12:00~13:00': [lakeHillTeaGuide],
    // 湖畔：可逛店铺清单
    '17:00~18:00': [toyaBrowseShopsGuide],
    // 晚饭：18:00 起可看；KARZZ 首选，其余备选
    '18:00~19:00': [toyaDinnerGuide],
    '19:00~20:00': [toyaDinnerGuide],
    // 烟花时段：原「现场资料」改为注意事项标题
    '20:00~21:00': [
      {
        title: '【观看烟花注意事项】',
        body: '尽量选择没有树木遮挡的岸边；\n汽船码头至中央温泉街湖畔都是可考虑区域。',
      },
    ],
  },
  4: {
    // 车上/抵达前：先看话术；正式执行在 10–12
    '9:00~10:00': [jozankeiKidsGuide],
    // 河童寻宝约 2 小时：家长任务清单 + 日文话术
    '10:00~11:00': [jozankeiKidsGuide],
    '11:00~12:00': [jozankeiKidsGuide],
    // 午餐：いち 首选，其余备选
    '12:00~13:00': [jozankeiLunchGuide],
    // 回家时段：去掉误挂的「逛」现场资料
    '17:00~18:00': [],
    // 晚餐：仅已预约的 GAjA
    '18:00~19:00': [day4DinnerGuide],
    // 饭后逛：纯 LIST，挂在 19–21
    '19:00~20:00': [day4NightBrowseGuide],
    '20:00~21:00': [day4NightBrowseGuide],
  },
}

const costCorrections: Record<number, Record<string, string>> = {
  1: {
    // 停车费属于抵达前，景点时段不再展示
    '15:00~16:00': '',
  },
}

const linkCorrections: Record<number, Record<string, { label: string; url: string }[]>> = {
  1: {
    '8:00~12:00': [],
    '12:00~13:00': [
      {
        label: '新千岁机场B停车场 | Google Maps',
        url: 'https://maps.google.com/?q=%E6%96%B0%E5%8D%83%E6%AD%B3%E7%A9%BA%E6%B8%AFB%E9%A7%90%E8%BB%8A%E5%A0%B4',
      },
    ],
    '14:00~15:00': [
      {
        label: 'Lake Shikotsu paid parking lot | Google Maps',
        url: 'https://maps.google.com/?q=Lake%20Shikotsu%20paid%20parking%20lot',
      },
    ],
    '18:00~19:00': [],
    '19:00~20:00': [
      {
        label: 'Seicomart Rusutsu | Google Maps',
        url: 'https://maps.google.com/?q=Seicomart%20Rusutsu',
      },
    ],
    '20:00~21:00': [
      {
        label: 'Seicomart Rusutsu | Google Maps',
        url: 'https://maps.google.com/?q=Seicomart%20Rusutsu',
      },
    ],
  },
  2: {
    '17:00~18:00': [],
    '18:00~19:00': [],
  },
  3: {
    '18:00~19:00': [],
    '19:00~20:00': [],
  },
  4: {
    '9:00~10:00': [
      {
        label: '河童寻宝中文亲子版（PDF）',
        url: docUrl('jozankei-kappa-rally-zh.pdf'),
      },
      {
        label: '定山溪旅游指南（PDF）',
        url: docUrl('day4-guide-script.pdf'),
      },
      {
        label: '定山溪活动资料',
        url: 'https://jozankei.jp/cn/oneday/ontama/',
      },
    ],
    '12:00~13:00': [],
    '18:00~19:00': [
      {
        label: 'トラストパークすすきの5・2 | Google Maps',
        url: 'https://maps.google.com/?q=%E3%83%88%E3%83%A9%E3%82%B9%E3%83%88%E3%83%91%E3%83%BC%E3%82%AF%E6%9C%AD%E5%B9%8C%E3%81%99%E3%81%99%E3%81%8D%E3%81%AE5%E3%83%BB2',
      },
    ],
    '19:00~20:00': [],
    '10:00~11:00': [
      {
        label: '河童寻宝中文亲子版（PDF）',
        url: docUrl('jozankei-kappa-rally-zh.pdf'),
      },
      {
        label: '定山溪游客中心 | Google Maps',
        url: 'https://maps.google.com/?q=Jozankei%20Tourist%20Information%20Center',
      },
    ],
    '11:00~12:00': [
      {
        label: '河童寻宝中文亲子版（PDF）',
        url: docUrl('jozankei-kappa-rally-zh.pdf'),
      },
      {
        label: '定山溪游客中心 | Google Maps',
        url: 'https://maps.google.com/?q=Jozankei%20Tourist%20Information%20Center',
      },
    ],
  },
  5: {
    '8:00~9:00': [
      {
        label: 'DAY5 美瑛富良野导游词（PDF）',
        url: docUrl('day5-guide-script.pdf'),
      },
    ],
  },
}

const roleCorrections: Record<number, Record<string, Partial<Pick<TimelineItem, 'dad' | 'mom' | 'kids'>>>> = {
  1: {
    '8:00~12:00': {
      dad: '【入境卡填写】机上离线按护照与住宿英文地址帮全家人填写并核对',
      mom: '【飞机简餐】照顾孩子用餐，护照与住宿英文地址备好给爸爸抄写',
      kids: '【飞机简餐】坐好吃饭休息，需要时把护照交给爸爸妈妈',
    },
    '12:00~13:00': {
      dad: '【过关取行李】→【J-Net接驳取车】→【开回B停车场发柱号+车照片】',
      mom: '【过关带娃】→【取行李】→【国际到达大厅等汇合消息后再出停车场】',
      kids: '【跟着大人过关】坐推车/拉杆箱旁休息，等爸爸发来停车位置再一起走',
    },
    '13:00~14:00': {
      dad: '【取车】在营业所办手续；随时回报进度，家人按清单买午饭',
      mom: '【机场午饭+采购】按门牌逛；先吃かま栄/十勝/きのとや，再买 Pasco 明早，顺手北菓楼、牛乳カステラ、Snow Cheese、LeTAO',
      kids: '【逛+吃】Pokémon Store、Calbee+ 薯条、ROYS；累了坐着等爸爸会合',
    },
    '14:00~15:00': {
      dad: '【开车】按上方停车导航去 Lake Shikotsu paid parking lot',
      mom: '【车上休息】看孩子休息即可，不用盯导航',
      kids: '【车上休息】系好安全带，跟妈妈休息，预计约 35 分钟到湖边',
    },
  },
  2: {
    '17:00~18:00': {
      dad: '【逛/晚饭准备】顺手确认并预订明早 Oktoberfest 早餐',
      mom: '【带娃】提醒爸爸完成 Oktoberfest 早餐预订，避免明早吃不上',
      kids: '【休息】跟大人逛园区，准备晚饭',
    },
    '18:00~19:00': {
      dad: '【晚饭】Kakashi 首选；满了改 Pub Cricket / Mokumokuya。务必订好明早 Oktoberfest',
      mom: '【晚饭】点餐照顾孩子；核对 Oktoberfest 早餐已预订',
      kids: '【吃】乖乖吃饭',
    },
  },
  4: {
    '10:00~11:00': {
      dad: '【河童寻宝】地图计时拍照；带队领册、盖章、找雕像',
      mom: '【河童寻宝】相机翻译题板（日→中）；照顾孩子节奏，别赶太猛',
      kids: '【寻宝】5岁找河童像；7岁把答案写进活动册圆圈',
    },
    '11:00~12:00': {
      dad: '【河童寻宝】带队去三个提示点，最后回案内所终题抽奖',
      mom: '【河童寻宝】继续翻译；午餐前确认册子填完并交工作人员',
      kids: '【寻宝】继续找像答题；累了就喝水休息，别乱跑楼梯',
    },
    '12:00~13:00': {
      dad: '【午餐】首选食堂いち；满了改はるらんな／こんの。先打开中文菜单摘要',
      mom: '【午餐】点餐照顾孩子；对照 PDF 菜单摘要沟通',
      kids: '【吃饭】乖乖吃饭，别乱跑',
    },
    '18:00~19:00': {
      dad: '【晚饭】GAjA 已预约 18:45；停车トラストパークすすきの5・2。出示预约凭证／报 #30633',
      mom: '【晚饭】点餐照顾孩子；对照菜单摘要；核对 6 人プレミア套餐',
      kids: '【吃饭】跟大人点肉，注意别烫到手',
    },
    '17:00~18:00': {
      dad: '【开车回家】回札幌公寓，准备晚上出门吃饭',
      mom: '【带娃回家】到家休整，收拾出门晚饭用品',
      kids: '【休息】到家喝水休息，准备出门吃饭',
    },
    '19:00~20:00': {
      dad: '【饭后逛】按清单先去早关门的店',
      mom: '【饭后逛】留意文具店／玩具店；看孩子别走散',
      kids: '【逛】跟大人走，想进店就举手说',
    },
    '20:00~21:00': {
      dad: '【饭后逛】继续按清单；留意 21:00 关门的店',
      mom: '【饭后逛】文具／玩具可再看一轮，别太晚',
      kids: '【逛】累了就跟大人说要回酒店',
    },
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

    const context = [detail, getText(row, 3), getText(row, 4), getText(row, 5)].join(' ')
    const tags = [...detail.matchAll(/【([^】]+)】/g)].map((match) => match[1])
    const roleFix = roleCorrections[currentDay]?.[time]
    const item: TimelineItem = {
      id: `day-${currentDay}-row-${rowIndex}`,
      time,
      title: getTitle(detail),
      detail,
      tags,
      dad: roleFix?.dad ?? getText(row, 3),
      mom: roleFix?.mom ?? getText(row, 4),
      kids: roleFix?.kids ?? getText(row, 5),
      links: linkCorrections[currentDay]?.[time] ?? getLinks(row, context),
      materials: materialCorrections[currentDay]?.[time] ?? getMaterials(row),
      costJpy: costCorrections[currentDay]?.[time] ?? getText(row, 8),
      costCny: toCny(costCorrections[currentDay]?.[time] ?? getText(row, 8)),
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
  party: '瓜瓜一家 · 小骑士一家の避暑旅行',
  source: sheetData.source,
  sourceUpdatedAt: sheetData.updatedAt,
}

export const packingTemplates = [
  {
    id: 'documents',
    title: '绝对不能忘的证件',
    items: ['护照', '入境资料与 Visit Japan Web', '紧急联系人卡', '驾驶证件与翻译件', '机票、住宿和租车凭证离线备份'],
  },
  {
    id: 'luggage',
    title: '行李箱配置',
    items: ['托运行李箱与行李牌', '随身背包', '衣物收纳袋', '鞋袋与脏衣袋', '折叠购物袋', '行李秤', 'AirTag 或行李定位器'],
  },
  {
    id: 'clothing',
    title: '北海道 8 月底衣物',
    items: ['短袖 4～5 件', '薄长袖 1～2 件', '长裤 2 条', '短裤或裙子 1～2 条', '内衣袜子 7～8 天用量', '轻薄防风外套', '防水外套或雨衣', '睡衣', '舒适运动鞋', '备用鞋或凉鞋', '遮阳帽', '折叠伞'],
  },
  {
    id: 'outdoor',
    title: '游乐园与户外用品',
    items: ['成人或儿童雨衣', '防晒霜', '驱蚊液', '太阳镜', '小毛巾或吸汗巾', '水杯', '一次性垃圾袋', '湿纸巾与纸巾', '创可贴', '儿童替换衣裤', '防水手机袋', '能量棒或独立包装零食', '轻便野餐垫', '塑料密封袋'],
  },
  {
    id: 'medicine',
    title: '常用药品',
    items: ['成人及儿童退烧药', '儿童体温计', '肠胃药', '便秘常用药', '止泻药', '晕车或晕船药', '抗过敏药', '眼药水', '创可贴与消毒棉片', '蚊虫叮咬药膏', '个人处方药与说明', '口罩'],
  },
  {
    id: 'electronics',
    title: '电子设备',
    items: ['手机', '充电器', '备用充电线', '充电宝', '车载 USB 充电器', '多口 USB 充电头', '日本 Type-A 转换插头', 'eSIM 或日本流量卡', '手机支架', '相机与存储卡', '儿童耳机', '平板电脑与离线动画'],
  },
  {
    id: 'payment',
    title: '支付准备',
    items: ['VISA 信用卡至少两张', '日元现金', '零钱袋', '备用小额纸币', '交通 IC 卡', '信用卡境外支付确认'],
  },
  {
    id: 'kids',
    title: '儿童专属',
    items: ['儿童牙刷与牙膏', '儿童洗护用品', '画笔与小本子', '小樽亲子任务卡', '儿童耳机', '儿童照相机', '儿童雨衣', '儿童晕车药', '轻便小背包'],
  },
] as const

export const guideSections = [
  {
    id: 'bookings',
    title: '预约与门票',
    intro: '出发前优先确认，现场只看结果。',
    items: [
      { title: '留寿都一日券', detail: '建议提前网上购买，包含游乐园、羊蹄缆车等；现场购票更贵。', badge: '待购票' },
      { title: '龙宫 Blue Cave', detail: '目标 8 月 28 日 10:30 船班；出发前再次确认海况与集合时间。', badge: '重点确认' },
      { title: 'GAjA すすきの店', detail: 'DAY4 18:45 已预约：プレミア食べ放題 ×6人，屏风隔间，编号 #30633。', badge: '已预约' },
      { title: '洞爷湖晚餐', detail: '首选 Restaurant & Flowers KARZZ；备选アペコロ、洋食屋 Fuji、焼肉 金城、OMOYA。', badge: '已纠正' },
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

/** Open Google Maps search in a new tab (stable UI; works with VPN). */
export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

/** Apple Maps web link — more reliable than Google inside WeChat on iPhone. */
export const appleMapsUrl = (query: string) =>
  `https://maps.apple.com/?q=${encodeURIComponent(query)}`

/** Android geo intent — opens an installed maps app chooser when allowed. */
export const androidGeoUrl = (query: string) =>
  `geo:0,0?q=${encodeURIComponent(query)}`

export const isWeChatBrowser = () =>
  typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)

export const isAppleTouchDevice = () =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

/**
 * Open navigation for the current environment.
 * WeChat blocks Google Maps + target=_blank often; copy the place name and
 * prefer Apple Maps / geo: so the system maps app can take over.
 */
export const openMapsNavigation = (query: string): 'wechat' | 'browser' => {
  const google = mapsUrl(query)
  if (isWeChatBrowser()) {
    copyTextReliable(query)
    if (isAppleTouchDevice()) {
      window.location.href = appleMapsUrl(query)
    } else {
      window.location.href = androidGeoUrl(query)
    }
    return 'wechat'
  }

  const opened = window.open(google, '_blank', 'noopener,noreferrer')
  if (!opened) window.location.assign(google)
  return 'browser'
}

export const isGoogleMapsWebUrl = (url: string) =>
  /(?:maps\.google\.|google\.[^/]+\/maps|maps\.app\.goo\.gl)/i.test(url)

export const queryFromMapsWebUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return (
      parsed.searchParams.get('query') ||
      parsed.searchParams.get('q') ||
      decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '') ||
      null
    )
  } catch {
    return null
  }
}

/** Sync copy — must run inside the click handler. */
export const copyTextReliable = (text: string): boolean => {
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
