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
  source?: string
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

const WEATHER_CACHE_KEY = 'hokkaido-weather-cache-v2'
const WEATHER_CACHE_TTL_MS = 3 * 60 * 60 * 1000

const OPEN_METEO_HOSTS = [
  'https://api.open-meteo.com/v1/forecast',
  // 部分网络打不开主站，换同协议备用主机再试一次
  'https://previous-runs-api.open-meteo.com/v1/forecast',
]

const fetchJson = async (url: string, timeoutMs = 9000) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    window.clearTimeout(timer)
  }
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

const openMeteoParams = (location: WeatherLocation) =>
  new URLSearchParams({
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

const parseOpenMeteo = (location: WeatherLocation, data: OpenMeteoResponse, source: string): LocationForecast => {

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
    source,
  }
}

type WttrHour = { time: string; tempC: string; chanceofrain: string; weatherCode: string; windspeedKmph: string }
type WttrDay = { date: string; maxtempC: string; mintempC: string; uvIndex: string; hourly?: WttrHour[] }
type WttrResponse = { weather?: WttrDay[] }

const wttrCodeToOwm = (code: string) => {
  const n = Number(code)
  if ([113].includes(n)) return 0
  if ([116].includes(n)) return 2
  if ([119, 122].includes(n)) return 3
  if ([143, 248, 260].includes(n)) return 45
  if ([176, 263, 266, 293, 296].includes(n)) return 61
  if ([299, 302, 305, 308, 353, 356, 359].includes(n)) return 63
  if ([200, 386, 389].includes(n)) return 95
  if ([227, 230, 323, 326, 329, 332, 338].includes(n)) return 71
  return 3
}

const parseWttr = (location: WeatherLocation, data: WttrResponse): LocationForecast => {
  const days = data.weather ?? []
  if (days.length === 0) throw new Error(`天气兜底为空：${location.name}`)

  const daily = days.map((day) => {
    const code = wttrCodeToOwm(day.hourly?.[4]?.weatherCode ?? day.hourly?.[0]?.weatherCode ?? '119')
    const precipProb = Math.max(
      ...((day.hourly ?? []).map((hour) => Number(hour.chanceofrain) || 0)),
      0,
    )
    const windKmh = Math.max(...((day.hourly ?? []).map((hour) => Number(hour.windspeedKmph) || 0)), 0)
    const windMs = windKmh / 3.6
    const base = {
      date: day.date,
      weatherCode: code,
      tempMax: Math.round(Number(day.maxtempC)),
      tempMin: Math.round(Number(day.mintempC)),
      precipSum: precipProb >= 70 ? 8 : precipProb >= 40 ? 2 : 0,
      precipProb: Math.round(precipProb),
      windMax: Number(windMs.toFixed(1)),
      gustMax: Number((windMs * 1.4).toFixed(1)),
      uvMax: Number(Number(day.uvIndex || 0).toFixed(1)),
    }
    const risk = assessRisk(base)
    const described = describeWeatherCode(code)
    return { ...base, ...risk, label: described.label, icon: described.icon }
  })

  const hourlyByDate: Record<string, HourlyWeather[]> = {}
  days.forEach((day) => {
    hourlyByDate[day.date] = (day.hourly ?? [])
      .filter((_, index) => index % 2 === 0)
      .map((hour) => {
        const raw = hour.time.padStart(4, '0')
        const hhmm = `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
        const code = wttrCodeToOwm(hour.weatherCode)
        const described = describeWeatherCode(code)
        return {
          time: `${day.date}T${hhmm}`,
          hour: hhmm,
          temperature: Math.round(Number(hour.tempC)),
          precipProb: Math.round(Number(hour.chanceofrain) || 0),
          weatherCode: code,
          label: described.label,
          wind: Number((Number(hour.windspeedKmph) / 3.6).toFixed(1)),
        }
      })
  })

  return {
    location,
    daily,
    hourlyByDate,
    updatedAt: new Date().toISOString(),
    source: 'wttr.in',
  }
}

const fetchFromOpenMeteo = async (location: WeatherLocation) => {
  const params = openMeteoParams(location)
  let lastError: unknown
  for (const host of OPEN_METEO_HOSTS) {
    try {
      const data = (await fetchJson(`${host}?${params}`)) as OpenMeteoResponse
      if (!data?.daily?.time?.length) throw new Error('empty')
      return parseOpenMeteo(location, data, host.includes('previous-runs') ? 'Open-Meteo 备用' : 'Open-Meteo')
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`天气接口失败：${location.name}`)
}

const fetchFromWttr = async (location: WeatherLocation) => {
  const url = `https://wttr.in/${location.latitude},${location.longitude}?format=j1&lang=zh`
  const data = (await fetchJson(url, 10000)) as WttrResponse
  return parseWttr(location, data)
}

export const fetchLocationForecast = async (location: WeatherLocation): Promise<LocationForecast> => {
  try {
    return await fetchFromOpenMeteo(location)
  } catch {
    return await fetchFromWttr(location)
  }
}

export const readWeatherCache = (): LocationForecast[] => {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { at: number; forecasts: LocationForecast[] }
    if (!parsed.at || Date.now() - parsed.at > WEATHER_CACHE_TTL_MS) return parsed.forecasts ?? []
    return parsed.forecasts ?? []
  } catch {
    return []
  }
}

export const writeWeatherCache = (forecasts: LocationForecast[]) => {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ at: Date.now(), forecasts }))
  } catch {
    // ignore quota
  }
}

export const fetchAllForecasts = async () => {
  const results = await Promise.allSettled(weatherLocations.map((location) => fetchLocationForecast(location)))
  const forecasts = results
    .filter((item): item is PromiseFulfilledResult<LocationForecast> => item.status === 'fulfilled')
    .map((item) => item.value)
  if (forecasts.length === 0) {
    const cached = readWeatherCache()
    if (cached.length > 0) return { forecasts: cached, partial: true, fromCache: true }
    throw new Error('天气接口暂时连不上，请稍后刷新或打开 VPN 再试')
  }
  writeWeatherCache(forecasts)
  return { forecasts, partial: forecasts.length < weatherLocations.length, fromCache: false }
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
