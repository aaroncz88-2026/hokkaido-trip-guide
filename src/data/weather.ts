export type WeatherLocation = {
  id: string
  name: string
  role: string
  latitude: number
  longitude: number
}

export type DailyWeather = {
  date: string
  weatherCode: number
  label: string
  icon: string
  tempMax: number
  tempMin: number
  precipSum: number
  precipProb: number
  windMax: number
  gustMax: number
  uvMax: number
  risk: 'calm' | 'watch' | 'alert'
  riskNote: string
}

export type HourlyWeather = {
  time: string
  hour: string
  temperature: number
  precipProb: number
  weatherCode: number
  label: string
  wind: number
}

export type LocationForecast = {
  location: WeatherLocation
  daily: DailyWeather[]
  hourlyByDate: Record<string, HourlyWeather[]>
  updatedAt: string
}

export type TyphoonSnapshot = {
  id: string
  number: string
  nameJp: string
  nameEn: string
  category: string
  categoryEn: string
  issue: string
  pressure?: string
  windMs?: string
  gustMs?: string
  location?: string
  course?: string
  speed?: string
  center?: [number, number]
  outlook: Array<{
    when: string
    label: string
    category: string
    location?: string
    course?: string
    center?: [number, number]
    windMs?: string
  }>
  hokkaidoNote: string
  concernLevel: 'low' | 'medium' | 'high'
}

export const weatherLocations: WeatherLocation[] = [
  { id: 'chitose', name: '新千岁 / 千岁', role: '落地与返程', latitude: 42.7752, longitude: 141.6925 },
  { id: 'rusutsu', name: '留寿都', role: 'DAY1–DAY3 住宿', latitude: 42.7506, longitude: 140.8961 },
  { id: 'toya', name: '洞爷湖', role: 'DAY3 火山湖畔', latitude: 42.5786, longitude: 140.8222 },
  { id: 'sapporo', name: '札幌', role: 'DAY4–DAY8 大本营', latitude: 43.0618, longitude: 141.3545 },
  { id: 'biei', name: '美瑛 / 富良野', role: 'DAY5 花田公路', latitude: 43.5883, longitude: 142.4671 },
  { id: 'otaru', name: '小樽', role: 'DAY6 海陆行程', latitude: 43.1907, longitude: 140.9947 },
]

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: '晴朗', icon: '☀️' },
  1: { label: '大部晴朗', icon: '🌤' },
  2: { label: '多云', icon: '⛅' },
  3: { label: '阴天', icon: '☁️' },
  45: { label: '有雾', icon: '🌫' },
  48: { label: '雾凇雾', icon: '🌫' },
  51: { label: '小毛毛雨', icon: '🌦' },
  53: { label: '毛毛雨', icon: '🌦' },
  55: { label: '较强毛毛雨', icon: '🌧' },
  61: { label: '小雨', icon: '🌧' },
  63: { label: '中雨', icon: '🌧' },
  65: { label: '大雨', icon: '🌧' },
  66: { label: '冻雨', icon: '🌧' },
  67: { label: '较强冻雨', icon: '🌧' },
  71: { label: '小雪', icon: '❄️' },
  73: { label: '中雪', icon: '❄️' },
  75: { label: '大雪', icon: '❄️' },
  80: { label: '阵雨', icon: '🌦' },
  81: { label: '较强阵雨', icon: '🌧' },
  82: { label: '暴阵雨', icon: '⛈' },
  95: { label: '雷暴', icon: '⛈' },
  96: { label: '雷暴伴冰雹', icon: '⛈' },
  99: { label: '强雷暴冰雹', icon: '⛈' },
}

export const describeWeatherCode = (code: number) =>
  weatherCodeMap[code] ?? { label: `天气代码 ${code}`, icon: '🌡' }

const assessRisk = (day: Omit<DailyWeather, 'risk' | 'riskNote' | 'label' | 'icon'>): Pick<DailyWeather, 'risk' | 'riskNote'> => {
  if (day.gustMax >= 20 || day.windMax >= 12 || day.precipSum >= 30 || day.precipProb >= 80) {
    return { risk: 'alert', riskNote: '风雨偏强，户外与游船建议改备选' }
  }
  if (day.gustMax >= 14 || day.windMax >= 8 || day.precipSum >= 8 || day.precipProb >= 55) {
    return { risk: 'watch', riskNote: '有阵雨或偏大风，记得带雨衣防风外套' }
  }
  return { risk: 'calm', riskNote: '适合按原计划推进' }
}

const distanceKm = (a: [number, number], b: [number, number]) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const HOKKAIDO_REF: [number, number] = [43.06, 141.35]

const typhoonConcern = (centers: Array<[number, number] | undefined>) => {
  const distances = centers
    .filter((point): point is [number, number] => Boolean(point))
    .map((point) => distanceKm(point, HOKKAIDO_REF))
  if (distances.length === 0) return { level: 'low' as const, note: '暂无明确路径点，请继续关注官方更新。' }
  const nearest = Math.min(...distances)
  if (nearest <= 450) {
    return { level: 'high' as const, note: `预报中心距札幌约 ${Math.round(nearest)} km，外围风雨可能波及北海道。` }
  }
  if (nearest <= 900) {
    return { level: 'medium' as const, note: `预报中心距札幌约 ${Math.round(nearest)} km，暂非直扑，但需盯紧是否北上。` }
  }
  return { level: 'low' as const, note: `目前路径偏远，距札幌约 ${Math.round(nearest)} km，直接冲击概率较低。` }
}

type OpenMeteoResponse = {
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    uv_index_max: number[]
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
    wind_speed_10m: number[]
  }
}

export const fetchLocationForecast = async (location: WeatherLocation): Promise<LocationForecast> => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: 'Asia/Tokyo',
    forecast_days: '16',
    wind_speed_unit: 'ms',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'uv_index_max',
    ].join(','),
    hourly: ['temperature_2m', 'precipitation_probability', 'weather_code', 'wind_speed_10m'].join(','),
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`天气接口失败：${location.name}`)
  const data = (await response.json()) as OpenMeteoResponse

  const daily = data.daily.time.map((date, index) => {
    const code = data.daily.weather_code[index]
    const base = {
      date,
      weatherCode: code,
      tempMax: Math.round(data.daily.temperature_2m_max[index]),
      tempMin: Math.round(data.daily.temperature_2m_min[index]),
      precipSum: Number(data.daily.precipitation_sum[index].toFixed(1)),
      precipProb: Math.round(data.daily.precipitation_probability_max[index] ?? 0),
      windMax: Number(data.daily.wind_speed_10m_max[index].toFixed(1)),
      gustMax: Number(data.daily.wind_gusts_10m_max[index].toFixed(1)),
      uvMax: Number((data.daily.uv_index_max[index] ?? 0).toFixed(1)),
    }
    const risk = assessRisk(base)
    const described = describeWeatherCode(code)
    return { ...base, ...risk, label: described.label, icon: described.icon }
  })

  const hourlyByDate: Record<string, HourlyWeather[]> = {}
  data.hourly.time.forEach((stamp, index) => {
    const [date, hour = '00:00'] = stamp.split('T')
    const hourNumber = Number(hour.slice(0, 2))
    if (hourNumber % 3 !== 0) return
    const described = describeWeatherCode(data.hourly.weather_code[index])
    const item: HourlyWeather = {
      time: stamp,
      hour: hour.slice(0, 5),
      temperature: Math.round(data.hourly.temperature_2m[index]),
      precipProb: Math.round(data.hourly.precipitation_probability[index] ?? 0),
      weatherCode: data.hourly.weather_code[index],
      label: described.label,
      wind: Number(data.hourly.wind_speed_10m[index].toFixed(1)),
    }
    hourlyByDate[date] = [...(hourlyByDate[date] ?? []), item]
  })

  return {
    location,
    daily,
    hourlyByDate,
    updatedAt: new Date().toISOString(),
  }
}

type JmaTarget = {
  tropicalCyclone: string
  typhoonNumber: string
  category: string
  issue: string
}

type JmaSpecPart = {
  part: string | { jp?: string; en?: string }
  typhoonNumber?: string
  name?: { jp?: string; en?: string }
  category?: { jp?: string; en?: string }
  issue?: { JST?: string }
  pressure?: string
  location?: string
  course?: string
  speed?: string | { note?: { jp?: string; en?: string } }
  maximumWind?: { sustained?: { 'm/s'?: string }; gust?: { 'm/s'?: string } }
  position?: { deg?: [number, number] }
  validtime?: { JST?: string }
  advancedHours?: number
}

const readPartLabel = (part: JmaSpecPart['part']) => {
  if (typeof part === 'string') return part
  return part.jp || part.en || '更新'
}

const readSpeed = (speed: JmaSpecPart['speed']) => {
  if (!speed) return undefined
  if (typeof speed === 'string') return `${speed} km/h`
  return speed.note?.jp || speed.note?.en
}

export const fetchTyphoonSnapshots = async (): Promise<TyphoonSnapshot[]> => {
  const listResponse = await fetch('https://www.jma.go.jp/bosai/typhoon/data/targetTc.json')
  if (!listResponse.ok) throw new Error('台风列表获取失败')
  const targets = (await listResponse.json()) as JmaTarget[]

  const snapshots = await Promise.all(
    targets.map(async (target) => {
      const response = await fetch(
        `https://www.jma.go.jp/bosai/typhoon/data/${target.tropicalCyclone}/specifications.json`,
      )
      if (!response.ok) throw new Error(`台风详情失败：${target.tropicalCyclone}`)
      const parts = (await response.json()) as JmaSpecPart[]
      const title = parts.find((part) => part.part === 'title')
      const analysis = parts.find((part) => readPartLabel(part.part).includes('実況') || part.advancedHours === 0)
      const outlook = parts
        .filter((part) => typeof part.advancedHours === 'number' && (part.advancedHours ?? 0) > 0)
        .map((part) => ({
          when: part.validtime?.JST?.replace('T', ' ').slice(0, 16) ?? '',
          label: readPartLabel(part.part),
          category: part.category?.jp || part.category?.en || target.category,
          location: part.location,
          course: part.course,
          center: part.position?.deg,
          windMs: part.maximumWind?.sustained?.['m/s'],
        }))

      const centers = [analysis?.position?.deg, ...outlook.map((item) => item.center)]
      const concern = typhoonConcern(centers)

      return {
        id: target.tropicalCyclone,
        number: target.typhoonNumber,
        nameJp: title?.name?.jp || analysis?.name?.jp || target.tropicalCyclone,
        nameEn: title?.name?.en || analysis?.name?.en || target.tropicalCyclone,
        category: analysis?.category?.jp || title?.category?.jp || target.category,
        categoryEn: analysis?.category?.en || title?.category?.en || target.category,
        issue: target.issue,
        pressure: analysis?.pressure,
        windMs: analysis?.maximumWind?.sustained?.['m/s'],
        gustMs: analysis?.maximumWind?.gust?.['m/s'],
        location: analysis?.location,
        course: analysis?.course,
        speed: readSpeed(analysis?.speed),
        center: analysis?.position?.deg,
        outlook,
        hokkaidoNote: concern.note,
        concernLevel: concern.level,
      } satisfies TyphoonSnapshot
    }),
  )

  return snapshots.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.concernLevel] - rank[b.concernLevel]
  })
}

export const tripDateSet = new Set([
  '2026-08-23',
  '2026-08-24',
  '2026-08-25',
  '2026-08-26',
  '2026-08-27',
  '2026-08-28',
  '2026-08-29',
  '2026-08-30',
])

export const getDayWeather = (forecasts: LocationForecast[], date: string, preferredLocationId?: string) => {
  const preferred =
    forecasts.find((item) => item.location.id === preferredLocationId) ??
    forecasts.find((item) => item.location.id === 'sapporo') ??
    forecasts[0]
  return preferred?.daily.find((day) => day.date === date)
}

export const dayLocationHint: Record<number, string> = {
  1: 'chitose',
  2: 'rusutsu',
  3: 'toya',
  4: 'sapporo',
  5: 'biei',
  6: 'otaru',
  7: 'sapporo',
  8: 'chitose',
}
