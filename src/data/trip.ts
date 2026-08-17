import sheetData from './sheetData.json'

export type SourceCell = {
  text: string
  url: string | null
}

export type FillGuideStep = {
  id: string
  field: string
  how: string
}

export type TimelineMaterial = {
  title: string
  body: string
  steps?: FillGuideStep[]
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
      { label: '支笏湖收费停车场', query: 'Lake Shikotsu paid parking lot' },
      { label: '支笏湖游船', query: 'Lake Shikotsu Sightseeing Ship' },
      { label: '翠葉 Rusutsu', query: 'Suiyo Rusutsu' },
    ],
    reminders: ['落地后先完成入境、行李和取车', '出发导航：Lake Shikotsu paid parking lot', '争取 15:00 到支笏湖', '晚间采购次日早餐与饮用水'],
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

const getMaterials = (row: Array<SourceCell | null>): TimelineMaterial[] =>
  row
    .slice(6, 8)
    .filter((cell): cell is SourceCell => {
      if (!cell) return false
      const text = cell.text.trim()
      if (!text || text === '停车点：') return false
      if (cell.url && isMostlyUrl(text)) return false
      if (cell.url) {
        const leftover = text.replace(/https?:\/\/\S+/gi, '').trim()
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
    .filter((material) => material.body.length >= 8)

const getTitle = (value: string) => {
  const cleaned = value.replace(/【([^】]+)】/g, '$1').replace(/\s+/g, ' ').trim()
  return cleaned.split(/[（(]/)[0].trim() || '行程安排'
}

const entryCardGuide: TimelineMaterial = {
  title: '入境卡填写对照',
  body: '机上按下面字段逐项填写。全部可离线对照，不依赖外链。孩子由家长代填，姓名必须与护照完全一致。',
  steps: [
    { id: 'name', field: '姓名 Name', how: '按护照英文大写抄写，字母、空格、顺序都不能改。' },
    { id: 'nationality', field: '国籍 Nationality', how: '填 CHINA / 中国。' },
    { id: 'birthday', field: '生年月日 Date of birth', how: '按护照日期填写（年 / 月 / 日）。' },
    { id: 'sex', field: '性别 Sex', how: '按护照标注填写。' },
    { id: 'passport', field: '护照号码 Passport No.', how: '完整抄写护照号码，写完再核对一遍。' },
    {
      id: 'occupation',
      field: '职业 Occupation',
      how: '大人可填 COMPANY EMPLOYEE / HOUSEWIFE / SELF-EMPLOYED；孩子填 CHILD 或 STUDENT。',
    },
    { id: 'purpose', field: '访日目的 Purpose', how: '填 TOURISM（观光）。' },
    { id: 'flight', field: '航班号 Flight No.', how: '填当日入境航班号。' },
    { id: 'from', field: '从何地来 Last embarkation', how: '填 CHINA 或出发城市。' },
    {
      id: 'address',
      field: '在日住址 Address in Japan',
      how: '填今晚住宿英文地址（翠葉 Rusutsu / 订单英文地址），两家保持一致。',
    },
    { id: 'days', field: '预定停留 Length of stay', how: '按返程日计算，本次到 8 月 30 日。' },
    { id: 'sign', field: '签名 Signature', how: '本人签名；孩子由家长代签。' },
    {
      id: 'customs',
      field: '海关申报 Customs',
      how: '普通游客一般无可申报物；有大额现金、肉制品、动植物才勾申报。不确定先问同行家长。',
    },
    {
      id: 'backup',
      field: '完成后核对',
      how: '每人一份填完；手机再留护照页与住宿英文地址截图，落地过关直接用。',
    },
  ],
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

const finalTimelineCorrections: Record<number, Record<string, string>> = {
  1: {
    '12:00~13:00':
      '【抵达】+【过关】+【取行李】+【接驳取车】\n12:30左右抵达→直奔关口→取行李→J-Net接驳→B停车场汇合',
    '14:00~15:00':
      '【会合】+【出发】→支笏湖\n约30公里 / 35分钟\n停车点：Lake Shikotsu paid parking lot',
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
    '8:00~12:00': [entryCardGuide],
    '12:00~13:00': [arrivalCustomsGuide, jnetShuttleGuide, parkingMeetupGuide],
  },
}

const linkCorrections: Record<number, Record<string, { label: string; url: string }[]>> = {
  1: {
    // 首页当前行动只保留离线填写对照，不展示失效外链
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
  },
}

const roleCorrections: Record<number, Record<string, Partial<Pick<TimelineItem, 'dad' | 'mom' | 'kids'>>>> = {
  1: {
    '8:00~12:00': {
      dad: '【入境卡填写】按下方对照表，帮全家人逐项填写并勾选完成',
      mom: '【飞机简餐】照顾孩子用餐，护照与住宿英文地址备好给爸爸抄写',
      kids: '【飞机简餐】坐好吃饭休息，需要时把护照交给爸爸妈妈',
    },
    '12:00~13:00': {
      dad: '【过关取行李】→【J-Net接驳取车】→【开回B停车场发柱号+车照片】',
      mom: '【过关带娃】→【取行李】→【国际到达大厅等汇合消息后再出停车场】',
      kids: '【跟着大人过关】坐推车/拉杆箱旁休息，等爸爸发来停车位置再一起走',
    },
    '14:00~15:00': {
      dad: '【开车】导航去 Lake Shikotsu paid parking lot；到停车场后发位置给家人',
      mom: '【车上休息】帮忙看导航与孩子，确认停车费现金/交通卡',
      kids: '【车上休息】系好安全带，预计约 35 分钟到湖边',
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

export const mapsWebUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export const isAndroidDevice = () =>
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

/** Must run inside the click handler — delayed clipboard writes are blocked on Android. */
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
    if (ok) return true
  } catch {
    // fall through
  }

  try {
    // May still work when called directly from a user gesture.
    void navigator.clipboard?.writeText(text)
    return Boolean(navigator.clipboard)
  } catch {
    return false
  }
}

const clickAnchor = (href: string) => {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** Android deep links that avoid the google.com「打开应用」interstitial. */
export const androidMapsLaunchUrls = (query: string) => {
  const q = encodeURIComponent(query)
  return [
    // Force Google Maps package via geo search
    `intent://0,0?q=${q}#Intent;scheme=geo;package=com.google.android.apps.maps;end`,
    // Any installed maps app
    `geo:0,0?q=${q}`,
    // Google Maps navigation scheme search
    `intent://?q=${q}#Intent;scheme=google.navigation;package=com.google.android.apps.maps;end`,
  ] as const
}

export const mapsUrl = (query: string) => {
  if (isAndroidDevice()) return androidMapsLaunchUrls(query)[0]
  return mapsWebUrl(query)
}

export const isGoogleMapsWebUrl = (url: string) =>
  /(?:maps\.google\.|google\.[^/]+\/maps|maps\.app\.goo\.gl|^intent:|^geo:)/i.test(url)

export const queryFromMapsWebUrl = (url: string) => {
  try {
    if (url.startsWith('intent:') || url.startsWith('geo:')) {
      const match = url.match(/[?&]q=([^#&]+)/)
      return match ? decodeURIComponent(match[1]) : null
    }
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

export type OpenMapsResult = {
  copied: boolean
  /** Call after ~1s if the page is still visible — show in-app fallback UI. */
  shouldOfferFallback: () => boolean
}

/**
 * Android: copy place name first (while gesture is valid), then try app deep links.
 * Never route through maps.google.com web interstitial.
 */
export const openInMaps = (query: string): OpenMapsResult => {
  if (isAndroidDevice()) {
    const copied = copyTextReliable(query)
    const [primary] = androidMapsLaunchUrls(query)
    clickAnchor(primary)
    return {
      copied,
      shouldOfferFallback: () => document.visibilityState === 'visible',
    }
  }

  try {
    const win = window.open(mapsWebUrl(query), '_blank', 'noopener,noreferrer')
    return { copied: false, shouldOfferFallback: () => !win }
  } catch {
    return { copied: false, shouldOfferFallback: () => true }
  }
}

export const retryAndroidMapsLaunch = (query: string, attempt: number) => {
  const urls = androidMapsLaunchUrls(query)
  const href = urls[Math.min(attempt, urls.length - 1)]
  clickAnchor(href)
}
