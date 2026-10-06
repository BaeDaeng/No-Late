import { API_LIMITS } from '../../config/apiLimits.js'

const cachePrefix = 'no-late:transit-route:cache:'

export function getCachedRoute(key) {
  const raw = sessionStorage.getItem(`${cachePrefix}${key}`)
  if (!raw) return null
  const record = JSON.parse(raw)
  return Date.now() - record.createdAt < API_LIMITS.transitRouteCacheTtlMs ? record.value : null
}

export function cacheRoute(key, value) { sessionStorage.setItem(`${cachePrefix}${key}`, JSON.stringify({ createdAt: Date.now(), value })) }
