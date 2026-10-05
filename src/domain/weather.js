const RE = 6371.00877
const GRID = 5
const SLAT1 = 30
const SLAT2 = 60
const OLON = 126
const OLAT = 38
const XO = 43
const YO = 136
const DEGRAD = Math.PI / 180

export function toKmaGrid(latitude, longitude) {
  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  const snLog = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
  const sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5) ** snLog * Math.cos(slat1) / snLog
  const ro = re * sf / Math.tan(Math.PI * 0.25 + OLAT * DEGRAD * 0.5) ** snLog
  const ra = re * sf / Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5) ** snLog
  const theta = (longitude * DEGRAD - olon) * snLog
  return { nx: Math.floor(ra * Math.sin(theta) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5) }
}

const baseHours = [2, 5, 8, 11, 14, 17, 20, 23]
export function getKmaBaseDateTime(now = new Date()) {
  const korea = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  korea.setUTCMinutes(korea.getUTCMinutes() - 15)
  let hour = korea.getUTCHours()
  if (!baseHours.includes(hour)) hour = [...baseHours].reverse().find((baseHour) => baseHour <= hour) ?? 23
  if (hour === 23 && korea.getUTCHours() < 2) korea.setUTCDate(korea.getUTCDate() - 1)
  const date = `${korea.getUTCFullYear()}${String(korea.getUTCMonth() + 1).padStart(2, '0')}${String(korea.getUTCDate()).padStart(2, '0')}`
  return { baseDate: date, baseTime: `${String(hour).padStart(2, '0')}00` }
}

export function pickWeatherForecast(items, targetTime) {
  const target = new Date(targetTime)
  const groups = new Map()
  items.forEach((item) => { const key = `${item.fcstDate}${item.fcstTime}`; groups.set(key, [...(groups.get(key) || []), item]) })
  const candidates = [...groups.entries()].map(([key, values]) => ({ key, values, at: new Date(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}T${key.slice(8, 10)}:${key.slice(10, 12)}:00+09:00`) })).filter(({ at }) => !Number.isNaN(at.getTime()))
  const selected = candidates.sort((a, b) => Math.abs(a.at - target) - Math.abs(b.at - target))[0]
  if (!selected) return null
  const values = Object.fromEntries(selected.values.map((item) => [item.category, item.fcstValue]))
  const pty = String(values.PTY || '0')
  return { precipitationType: pty === '1' ? 'rain' : pty === '2' ? 'mixed' : pty === '3' ? 'snow' : 'none', precipitationMm: values.PCP && values.PCP !== '강수없음' ? Number.parseFloat(values.PCP) : 0, forecastAt: selected.at.toISOString(), source: 'kma', fetchedAt: new Date().toISOString(), isFallback: false }
}
