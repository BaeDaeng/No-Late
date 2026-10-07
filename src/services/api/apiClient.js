import { ensureAnonymousSession, supabase } from '../../supabase.js'
import { REALTIME_LIMITS } from '../../config/realtimeLimits.js'
import { getKmaBaseDateTime, pickWeatherForecast, toKmaGrid } from '../../domain/weather.js'
import { toSubwayArrivals } from '../../domain/transitArrival.js'
import { cacheRoute, getCachedRoute } from './requestCache.js'

const realtimeCachePrefix = 'no-late:realtime:'

async function requestApi(action, params, signal) { if (!supabase) throw new Error('Supabase 연결 정보가 설정되지 않았습니다.'); await ensureAnonymousSession(); const { data, error } = await supabase.functions.invoke('api', { body: { action, ...params }, signal }); if (error || data?.error) throw new Error(data?.error || error.message); return data }

function getCachedRealtime(key) { try { const value = JSON.parse(sessionStorage.getItem(`${realtimeCachePrefix}${key}`)); return value && value.expiresAt > Date.now() ? value.data : null } catch { return null } }
function cacheRealtime(key, data, ttlMs) { try { sessionStorage.setItem(`${realtimeCachePrefix}${key}`, JSON.stringify({ data, expiresAt: Date.now() + ttlMs })) } catch { /* sessionStorage is an optimization only */ } }
function asList(value) { return Array.isArray(value) ? value : value ? [value] : [] }

export const apiClient = {
  async searchPlaces(query, signal) {
    return requestApi('kakao-place', { query }, signal)
  },

  async reverseGeocode({ latitude, longitude }, signal) {
    const data = await requestApi('kakao-reverse', { latitude, longitude, signal })
    const document = data.documents?.[0]
    return { id: `current:${longitude.toFixed(6)},${latitude.toFixed(6)}`, name: document?.road_address?.building_name || document?.address?.address_name || '현재 위치', address: document?.road_address?.address_name || document?.address?.address_name || '', latitude, longitude }
  },

  async getNearbyPlaces({ latitude, longitude }) {
    const cacheKey = `nearby:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return cached
    const data = await requestApi('kakao-nearby', { latitude, longitude, radius: 350 })
    const places = (data.documents || []).map((document) => ({ id: document.id, name: document.place_name, address: document.road_address_name || document.address_name || '', latitude: Number(document.y), longitude: Number(document.x), category: document.category_group_name || '', phone: document.phone || '' }))
    cacheRealtime(cacheKey, places, 5 * 60 * 1000)
    return places
  },

  async getTransitRoutes(origin, destination) {
    if (![origin.latitude, origin.longitude, destination.latitude, destination.longitude].every(Number.isFinite)) throw new Error('출발지와 목적지의 좌표가 필요합니다.')
    const cacheKey = [origin.longitude, origin.latitude, destination.longitude, destination.latitude].map((value) => value.toFixed(5)).join(':')
    const cached = getCachedRoute(cacheKey)
    if (cached) return { ...cached, fromCache: true }
    const data = await requestApi('kakao-public-transit', { start_x: origin.longitude, start_y: origin.latitude, end_x: destination.longitude, end_y: destination.latitude, s_name: origin.name, e_name: destination.name })
    cacheRoute(cacheKey, data)
    return { ...data, fromCache: false }
  },

  async getWeatherForecast(coordinates, targetTime) {
    const grid = toKmaGrid(coordinates.latitude, coordinates.longitude)
    const { baseDate, baseTime } = getKmaBaseDateTime()
    const cacheKey = `weather:${grid.nx}:${grid.ny}:${baseDate}:${baseTime}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { ...cached, fromCache: true }
    const data = await requestApi('weather', { baseDate, baseTime, nx: grid.nx, ny: grid.ny })
    const items = data.response?.body?.items?.item || []
    const weather = pickWeatherForecast(items, targetTime)
    if (!weather) throw new Error('이동 시간대의 날씨 예보를 찾지 못했습니다.')
    cacheRealtime(cacheKey, weather, REALTIME_LIMITS.weatherCacheTtlMs)
    return { ...weather, fromCache: false }
  },

  async getSubwayArrivals(stationName) {
    const cacheKey = `subway:${stationName}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { arrivals: cached, fromCache: true }
    const data = await requestApi('subway', { stationName })
    const arrivals = toSubwayArrivals(data, stationName)
    cacheRealtime(cacheKey, arrivals, REALTIME_LIMITS.transitCacheTtlMs)
    return { arrivals, fromCache: false }
  },

  async getSubwayLineStations() {
    const cacheKey = 'subway-line-stations'
    const cached = getCachedRealtime(cacheKey)
    if (cached) return cached
    const data = await requestApi('subway-line-stations', {})
    const rows = asList(data.SearchSTNBySubwayLineInfo?.row)
    const lines = rows.reduce((result, item) => {
      const line = String(item.LINE_NUM || item.SUBWAY_LINE || '').trim()
      const station = String(item.STATION_NM || '').trim()
      if (!line || !station) return result
      result[line] ||= []
      if (!result[line].includes(station)) result[line].push(station)
      return result
    }, {})
    cacheRealtime(cacheKey, lines, 24 * 60 * 60 * 1000)
    return lines
  },

  async getBusVehiclePositions(routeId) {
    if (!routeId) throw new Error('버스 노선 식별자가 없습니다.')
    const cacheKey = `bus:${routeId}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { data: cached, fromCache: true }
    const data = await requestApi('bus', { routeId })
    cacheRealtime(cacheKey, data, REALTIME_LIMITS.transitCacheTtlMs)
    return { data, fromCache: false }
  },

  async searchBusRoutes(query) {
    const data = await requestApi('bus-routes', { query })
    return asList(data.msgBody?.itemList).map((item) => ({ id: String(item.busRouteId), number: item.busRouteNm || '', startName: item.stStationNm || '', endName: item.edStationNm || '', intervalMinutes: Number(item.term) || null, type: String(item.routeType || '') }))
  },

  async getBusRouteStops(routeId) {
    const data = await requestApi('bus-route-stops', { routeId })
    return asList(data.msgBody?.itemList).map((item) => ({ id: String(item.station || item.stationId || item.arsId || item.seq), arsId: item.arsId || '', name: item.stationNm || '', order: Number(item.seq) || 1, latitude: Number(item.gpsY) || null, longitude: Number(item.gpsX) || null }))
  },

  async getBusArrival({ stationId, routeId, order }) {
    const data = await requestApi('bus-arrival', { stationId, routeId, order })
    const item = asList(data.msgBody?.itemList)[0]
    if (!item) return null
    return { first: item.arrmsg1 || '', second: item.arrmsg2 || '', firstSeconds: Number(item.arrmsgSec1) || null, secondSeconds: Number(item.arrmsgSec2) || null }
  },
}
