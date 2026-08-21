export type WeatherLocation = {
  id: string
  name: string
  role: string
  latitude: number
  longitude: number
  /** 气象厅府県预报区（如 016000） */
  jmaOffice: string
  /** 短期预报细分区（如 016010 石狩地方） */
  jmaClassArea: string
  /** 周预报温度代表点（如 14163 札幌） */
  jmaTempArea?: string
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
  {
    id: 'chitose',
    name: '新千岁 / 千岁',
    role: '落地与返程',
    latitude: 42.7752,
    longitude: 141.6925,
    jmaOffice: '016000',
    jmaClassArea: '016010',
    jmaTempArea: '14163',
  },
  {
    id: 'rusutsu',
    name: '留寿都',
    role: 'DAY1–DAY3 住宿',
    latitude: 42.7506,
    longitude: 140.8961,
    jmaOffice: '016000',
    jmaClassArea: '016030',
    jmaTempArea: '16217',
  },
  {
    id: 'toya',
    name: '洞爷湖',
    role: 'DAY3 火山湖畔',
    latitude: 42.5786,
    longitude: 140.8222,
    jmaOffice: '015000',
    jmaClassArea: '015010',
  },
  {
    id: 'sapporo',
    name: '札幌',
    role: 'DAY4–DAY8 大本营',
    latitude: 43.0618,
    longitude: 141.3545,
    jmaOffice: '016000',
    jmaClassArea: '016010',
    jmaTempArea: '14163',
  },
  {
    id: 'biei',
    name: '美瑛 / 富良野',
    role: 'DAY5 花田公路',
    latitude: 43.5883,
    longitude: 142.4671,
    jmaOffice: '012000',
    jmaClassArea: '012010',
  },
  {
    id: 'otaru',
    name: '小樽',
    role: 'DAY6 海陆行程',
    latitude: 43.1907,
    longitude: 140.9947,
    jmaOffice: '016000',
    jmaClassArea: '016030',
    jmaTempArea: '16217',
  },
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

const assessRisk = (
  day: Omit<DailyWeather, 'risk' | 'riskNote' | 'label' | 'icon'>,
  noteHint?: string,
): Pick<DailyWeather, 'risk' | 'riskNote'> => {
  if (day.gustMax >= 20 || day.windMax >= 12 || day.precipSum >= 30 || day.precipProb >= 80) {
    return { risk: 'alert', riskNote: noteHint || '风雨偏强，户外与游船建议改备选' }
  }
  if (day.gustMax >= 14 || day.windMax >= 8 || day.precipSum >= 8 || day.precipProb >= 55) {
    return { risk: 'watch', riskNote: noteHint || '有阵雨或偏大风，记得带雨衣防风外套' }
  }
  return { risk: 'calm', riskNote: noteHint || '适合按原计划推进' }
}

const WEATHER_CACHE_KEY = 'hokkaido-weather-cache-v3'
const WEATHER_CACHE_TTL_MS = 3 * 60 * 60 * 1000

const OPEN_METEO_HOSTS = [
  'https://api.open-meteo.com/v1/forecast',
  'https://previous-runs-api.open-meteo.com/v1/forecast',
]

const JMA_FORECAST_URL = (office: string) =>
  `https://www.jma.go.jp/bosai/forecast/data/forecast/${office}.json`

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

/** 气象厅天气代码 → WMO 风格代码（用于图标） */
const jmaCodeToWmo = (code: string | number) => {
  const n = Number(code)
  if (!Number.isFinite(n)) return 3
  if (n === 100) return 0
  if ([101, 110, 111, 112, 113, 114, 130].includes(n)) return 1
  if ([102, 103, 104, 107, 108, 140].includes(n)) return 80
  if ([115, 116, 117, 118, 119, 125, 160, 170].includes(n)) return 2
  if ([200, 209, 231].includes(n)) return 3
  if ([201, 210, 211, 212, 213, 214, 220, 221, 222, 223, 224, 225, 226, 228].includes(n)) return 2
  if ([202, 203, 204, 205, 206, 207, 208, 215, 216, 217, 218, 219, 227, 229, 230, 240, 250].includes(n))
    return 61
  if ([300, 301, 302, 303, 304, 306, 308, 309, 311, 313, 314, 315, 316, 317, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 340, 350].includes(n))
    return n >= 308 && n < 311 ? 65 : 63
  if ([400, 401, 402, 403, 405, 406, 407, 409, 411, 413, 414, 420, 421, 422, 423, 425, 426, 427, 450].includes(n))
    return 71
  if (n >= 100 && n < 200) return 1
  if (n >= 200 && n < 300) return 3
  if (n >= 300 && n < 400) return 63
  if (n >= 400) return 71
  return 3
}

const jmaLabelFromCode = (code: string | number) => {
  const n = Number(code)
  const map: Record<number, string> = {
    100: '晴',
    101: '晴时多云',
    102: '晴偶有雨',
    200: '阴',
    201: '阴时晴',
    202: '阴偶有雨',
    203: '阴时有雨',
    204: '阴偶有雪',
    206: '阴偶有雨或雪',
    300: '雨',
    301: '雨时晴',
    302: '雨时停',
    303: '雨时雪',
    306: '大雨',
    308: '暴雨',
    311: '雨转晴',
    313: '雨转阴',
    314: '雨转雪',
    400: '雪',
    401: '雪时晴',
    402: '雪时停',
    403: '雪时雨',
  }
  if (map[n]) return map[n]
  if (n >= 100 && n < 200) return '晴到多云'
  if (n >= 200 && n < 300) return '多云到阴'
  if (n >= 300 && n < 400) return '有雨'
  if (n >= 400) return '有雪'
  return `天气 ${code}`
}

const tidyJmaText = (text?: string) =>
  (text ?? '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const toDateKey = (iso: string) => iso.slice(0, 10)

type JmaAreaBlock = {
  area: { name: string; code: string }
  weatherCodes?: string[]
  weathers?: string[]
  winds?: string[]
  pops?: string[]
  temps?: string[]
  tempsMin?: string[]
  tempsMax?: string[]
}

type JmaTimeSeries = {
  timeDefines: string[]
  areas: JmaAreaBlock[]
}

type JmaForecastPayload = Array<{
  publishingOffice?: string
  reportDatetime?: string
  timeSeries: JmaTimeSeries[]
}>

type JmaDayDraft = {
  date: string
  weatherCode: number
  label: string
  precipProb: number
  tempMax: number
  tempMin: number
  note: string
}

const pickArea = (areas: JmaAreaBlock[], preferredCodes: string[]) => {
  for (const code of preferredCodes) {
    const hit = areas.find((item) => item.area.code === code)
    if (hit) return hit
  }
  return areas[0]
}

const parseJmaDaily = (location: WeatherLocation, payload: JmaForecastPayload): JmaDayDraft[] => {
  if (!Array.isArray(payload) || payload.length === 0) throw new Error(`气象厅数据为空：${location.name}`)

  const byDate = new Map<string, JmaDayDraft>()
  const ensure = (date: string) => {
    const existing = byDate.get(date)
    if (existing) return existing
    const created: JmaDayDraft = {
      date,
      weatherCode: 3,
      label: '阴天',
      precipProb: 0,
      tempMax: 0,
      tempMin: 0,
      note: '',
    }
    byDate.set(date, created)
    return created
  }

  const short = payload[0]
  const week = payload[1]

  // 短期：今天傍晚 / 明天 / 后天
  if (short?.timeSeries?.[0]) {
    const weatherTs = short.timeSeries[0]
    const area = pickArea(weatherTs.areas, [location.jmaClassArea, location.jmaOffice])
    weatherTs.timeDefines.forEach((stamp, index) => {
      const date = toDateKey(stamp)
      const draft = ensure(date)
      const jmaCode = area.weatherCodes?.[index]
      if (jmaCode) {
        draft.weatherCode = jmaCodeToWmo(jmaCode)
        draft.label = jmaLabelFromCode(jmaCode)
      }
      const weatherText = tidyJmaText(area.weathers?.[index])
      const windText = tidyJmaText(area.winds?.[index])
      draft.note = [weatherText, windText].filter(Boolean).join(' · ')
    })
  }

  // 短期降水概率（按半日），取当日最大值
  if (short?.timeSeries?.[1]) {
    const popTs = short.timeSeries[1]
    const area = pickArea(popTs.areas, [location.jmaClassArea, location.jmaOffice])
    const buckets = new Map<string, number[]>()
    popTs.timeDefines.forEach((stamp, index) => {
      const date = toDateKey(stamp)
      const value = Number(area.pops?.[index])
      if (!Number.isFinite(value)) return
      buckets.set(date, [...(buckets.get(date) ?? []), value])
    })
    buckets.forEach((values, date) => {
      ensure(date).precipProb = Math.max(...values, 0)
    })
  }

  // 短期代表点气温（通常只有明天清晨/白天）
  if (short?.timeSeries?.[2]) {
    const tempTs = short.timeSeries[2]
    const preferred = [
      location.jmaTempArea,
      location.id === 'rusutsu' || location.id === 'otaru' ? '16217' : undefined,
      '14163',
    ].filter(Boolean) as string[]
    const area = pickArea(tempTs.areas, preferred)
    const times = tempTs.timeDefines.map(toDateKey)
    const temps = (area.temps ?? []).map(Number)
    // JMA 常见：00:00 = 最低，09:00 = 最高
    times.forEach((date, index) => {
      const value = temps[index]
      if (!Number.isFinite(value)) return
      const draft = ensure(date)
      const hour = Number(tempTs.timeDefines[index].slice(11, 13))
      if (hour < 6) draft.tempMin = Math.round(value)
      else draft.tempMax = Math.round(value)
    })
  }

  // 一周预报：天气码 + 降水概率 + 气温
  if (week?.timeSeries?.[0]) {
    const weatherTs = week.timeSeries[0]
    const area = pickArea(weatherTs.areas, [location.jmaOffice, location.jmaClassArea])
    weatherTs.timeDefines.forEach((stamp, index) => {
      const date = toDateKey(stamp)
      const draft = ensure(date)
      const jmaCode = area.weatherCodes?.[index]
      if (jmaCode) {
        draft.weatherCode = jmaCodeToWmo(jmaCode)
        draft.label = jmaLabelFromCode(jmaCode)
      }
      const pop = Number(area.pops?.[index])
      if (Number.isFinite(pop)) draft.precipProb = Math.max(draft.precipProb, pop)
    })
  }

  if (week?.timeSeries?.[1]) {
    const tempTs = week.timeSeries[1]
    const preferred = [
      location.jmaTempArea,
      location.id === 'rusutsu' || location.id === 'otaru' ? '16217' : undefined,
      tempTs.areas[0]?.area.code,
    ].filter(Boolean) as string[]
    const area = pickArea(tempTs.areas, preferred)
    tempTs.timeDefines.forEach((stamp, index) => {
      const date = toDateKey(stamp)
      const draft = ensure(date)
      const max = Number(area.tempsMax?.[index])
      const min = Number(area.tempsMin?.[index])
      if (Number.isFinite(max) && max !== 0) draft.tempMax = Math.round(max)
      if (Number.isFinite(min) && min !== 0) draft.tempMin = Math.round(min)
    })
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
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
    // 日本附近优先用气象厅全球模式；其余字段仍由 Open-Meteo 补齐
    models: 'jma_gsm',
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

const openMeteoDefaultParams = (location: WeatherLocation) => {
  const params = openMeteoParams(location)
  params.delete('models')
  return params
}

const parseOpenMeteo = (location: WeatherLocation, data: OpenMeteoResponse, source: string): LocationForecast => {
  const daily = data.daily.time.map((date, index) => {
    const code = data.daily.weather_code[index]
    if (code == null || data.daily.temperature_2m_max[index] == null) return null
    const base = {
      date,
      weatherCode: code,
      tempMax: Math.round(data.daily.temperature_2m_max[index]),
      tempMin: Math.round(data.daily.temperature_2m_min[index]),
      precipSum: Number((data.daily.precipitation_sum[index] ?? 0).toFixed(1)),
      precipProb: Math.round(data.daily.precipitation_probability_max[index] ?? 0),
      windMax: Number((data.daily.wind_speed_10m_max[index] ?? 0).toFixed(1)),
      gustMax: Number((data.daily.wind_gusts_10m_max[index] ?? 0).toFixed(1)),
      uvMax: Number((data.daily.uv_index_max[index] ?? 0).toFixed(1)),
    }
    const risk = assessRisk(base)
    const described = describeWeatherCode(code)
    return { ...base, ...risk, label: described.label, icon: described.icon }
  }).filter((day): day is DailyWeather => Boolean(day))

  const hourlyByDate: Record<string, HourlyWeather[]> = {}
  data.hourly.time.forEach((stamp, index) => {
    if (data.hourly.temperature_2m[index] == null) return
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
      wind: Number((data.hourly.wind_speed_10m[index] ?? 0).toFixed(1)),
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

const estimatePrecipSum = (precipProb: number) => {
  if (precipProb >= 80) return 12
  if (precipProb >= 60) return 6
  if (precipProb >= 40) return 2
  if (precipProb >= 20) return 0.5
  return 0
}

const mergeJmaOntoOpenMeteo = (
  location: WeatherLocation,
  openMeteo: LocationForecast,
  jmaDays: JmaDayDraft[],
): LocationForecast => {
  const jmaMap = new Map(jmaDays.map((day) => [day.date, day]))
  const dates = new Set([...openMeteo.daily.map((day) => day.date), ...jmaDays.map((day) => day.date)])
  const daily = [...dates]
    .sort()
    .map((date) => {
      const om = openMeteo.daily.find((day) => day.date === date)
      const jma = jmaMap.get(date)
      if (!om && !jma) return null

      if (jma) {
        const base = {
          date,
          weatherCode: jma.weatherCode,
          tempMax: jma.tempMax || om?.tempMax || 0,
          tempMin: jma.tempMin || om?.tempMin || 0,
          precipSum: om?.precipSum ?? estimatePrecipSum(jma.precipProb),
          precipProb: jma.precipProb || om?.precipProb || 0,
          windMax: om?.windMax ?? 0,
          gustMax: om?.gustMax ?? 0,
          uvMax: om?.uvMax ?? 0,
        }
        const risk = assessRisk(base, jma.note || undefined)
        const described = describeWeatherCode(jma.weatherCode)
        return {
          ...base,
          ...risk,
          label: jma.label || described.label,
          icon: described.icon,
        }
      }

      return om!
    })
    .filter((day): day is DailyWeather => Boolean(day))

  return {
    location,
    daily,
    hourlyByDate: openMeteo.hourlyByDate,
    updatedAt: new Date().toISOString(),
    source: '气象厅 JMA + Open-Meteo',
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
    const precipProb = Math.max(...((day.hourly ?? []).map((hour) => Number(hour.chanceofrain) || 0)), 0)
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
  let lastError: unknown
  const attempts: Array<{ params: URLSearchParams; label: string }> = [
    { params: openMeteoParams(location), label: 'Open-Meteo JMA-GSM' },
    { params: openMeteoDefaultParams(location), label: 'Open-Meteo' },
  ]

  for (const attempt of attempts) {
    for (const host of OPEN_METEO_HOSTS) {
      try {
        const data = (await fetchJson(`${host}?${attempt.params}`)) as OpenMeteoResponse
        if (!data?.daily?.time?.length) throw new Error('empty')
        const source = host.includes('previous-runs') ? `${attempt.label} 备用` : attempt.label
        return parseOpenMeteo(location, data, source)
      } catch (error) {
        lastError = error
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`天气接口失败：${location.name}`)
}

const fetchFromJma = async (location: WeatherLocation) => {
  const data = (await fetchJson(JMA_FORECAST_URL(location.jmaOffice), 10000)) as JmaForecastPayload
  return parseJmaDaily(location, data)
}

const fetchFromWttr = async (location: WeatherLocation) => {
  const url = `https://wttr.in/${location.latitude},${location.longitude}?format=j1&lang=zh`
  const data = (await fetchJson(url, 10000)) as WttrResponse
  return parseWttr(location, data)
}

const jmaOnlyForecast = (location: WeatherLocation, jmaDays: JmaDayDraft[]): LocationForecast => {
  const daily = jmaDays.map((day) => {
    const base = {
      date: day.date,
      weatherCode: day.weatherCode,
      tempMax: day.tempMax,
      tempMin: day.tempMin,
      precipSum: estimatePrecipSum(day.precipProb),
      precipProb: day.precipProb,
      windMax: 0,
      gustMax: 0,
      uvMax: 0,
    }
    const risk = assessRisk(base, day.note || undefined)
    const described = describeWeatherCode(day.weatherCode)
    return {
      ...base,
      ...risk,
      label: day.label || described.label,
      icon: described.icon,
    }
  })
  return {
    location,
    daily,
    hourlyByDate: {},
    updatedAt: new Date().toISOString(),
    source: '气象厅 JMA',
  }
}

export const fetchLocationForecast = async (location: WeatherLocation): Promise<LocationForecast> => {
  // 优先：日本气象厅官方日预报 + Open-Meteo（JMA 模式）补小时/风力
  const jmaPromise = fetchFromJma(location)
  const omPromise = fetchFromOpenMeteo(location)

  const [jmaResult, omResult] = await Promise.allSettled([jmaPromise, omPromise])

  if (jmaResult.status === 'fulfilled' && omResult.status === 'fulfilled') {
    return mergeJmaOntoOpenMeteo(location, omResult.value, jmaResult.value)
  }
  if (jmaResult.status === 'fulfilled') {
    return jmaOnlyForecast(location, jmaResult.value)
  }
  if (omResult.status === 'fulfilled') {
    return omResult.value
  }

  return await fetchFromWttr(location)
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

/** Prefer the day's actual itinerary (after DAY2/DAY3 swap) over the original day number. */
export const locationHintForPlan = (day: { day: number; title: string; route: string }) => {
  const hay = `${day.title} ${day.route}`
  if (/有珠|洞爷|Lake Hill/i.test(hay)) return 'toya'
  if (/留寿都/.test(hay)) return 'rusutsu'
  return dayLocationHint[day.day] ?? 'sapporo'
}
