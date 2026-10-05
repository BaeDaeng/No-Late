import { API_LIMITS } from '../../config/apiLimits.js'

const cachePrefix = 'no-late:odsay:cache:'
const countPrefix = 'no-late:odsay:count:'

function todayKey() { return new Date().toISOString().slice(0, 10) }

export function getCachedRoute(key) {
  const raw = sessionStorage.getItem(`${cachePrefix}${key}`)
  if (!raw) return null
  const record = JSON.parse(raw)
  return Date.now() - record.createdAt < API_LIMITS.odsayCacheTtlMs ? record.value : null
}

export function cacheRoute(key, value) { sessionStorage.setItem(`${cachePrefix}${key}`, JSON.stringify({ createdAt: Date.now(), value })) }
export function getOdsayRequestCount() { return Number(sessionStorage.getItem(`${countPrefix}${todayKey()}`) || 0) }
export function reserveOdsayRequest() {
  const count = getOdsayRequestCount()
  if (count >= API_LIMITS.odsayDailyRequestLimit) throw new Error(`ODsay 호출 보호 한도(${API_LIMITS.odsayDailyRequestLimit}회)에 도달했습니다. 같은 경로는 30분간 캐시됩니다.`)
  sessionStorage.setItem(`${countPrefix}${todayKey()}`, String(count + 1))
}
