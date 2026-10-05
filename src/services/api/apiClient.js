import { publicApiKeys } from '../../config/publicApiKeys.js'
import { REALTIME_LIMITS } from '../../config/realtimeLimits.js'
import { getKmaBaseDateTime, pickWeatherForecast, toKmaGrid } from '../../domain/weather.js'
import { toSubwayArrivals } from '../../domain/transitArrival.js'
import { cacheRoute, getCachedRoute, reserveOdsayRequest } from './requestCache.js'

const kakaoBaseUrl = 'https://dapi.kakao.com/v2/local'
const odsayBaseUrl = 'https://api.odsay.com/v1/api/searchPubTransPathT'
const kmaBaseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
const subwayBaseUrl = 'https://swopenAPI.seoul.go.kr/api/subway'
const busBaseUrl = 'https://ws.bus.go.kr/api/rest/buspos/getBusPosByRouteSt'
const realtimeCachePrefix = 'no-late:realtime:'

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`요청에 실패했습니다. (${response.status})`)
  return response.json()
}

function requireKey(value, label) {
  if (!value) throw new Error(`${label} 키가 설정되지 않았습니다.`)
  return value
}

function getCachedRealtime(key) { try { const value = JSON.parse(sessionStorage.getItem(`${realtimeCachePrefix}${key}`)); return value && value.expiresAt > Date.now() ? value.data : null } catch { return null } }
function cacheRealtime(key, data, ttlMs) { try { sessionStorage.setItem(`${realtimeCachePrefix}${key}`, JSON.stringify({ data, expiresAt: Date.now() + ttlMs })) } catch { /* sessionStorage is an optimization only */ } }

export const apiClient = {
  async searchPlaces(query, signal) {
    const key = requireKey(publicApiKeys.kakaoRestApiKey, 'Kakao REST API')
    const url = new URL(`${kakaoBaseUrl}/search/keyword.json`)
    url.searchParams.set('query', query)
    url.searchParams.set('size', '5')
    return requestJson(url, { headers: { Authorization: `KakaoAK ${key}` }, signal })
  },

  async reverseGeocode({ latitude, longitude }, signal) {
    const key = requireKey(publicApiKeys.kakaoRestApiKey, 'Kakao REST API')
    const url = new URL(`${kakaoBaseUrl}/geo/coord2address.json`)
    url.searchParams.set('x', longitude)
    url.searchParams.set('y', latitude)
    const data = await requestJson(url, { headers: { Authorization: `KakaoAK ${key}` }, signal })
    const document = data.documents?.[0]
    return { id: `current:${longitude.toFixed(6)},${latitude.toFixed(6)}`, name: document?.road_address?.building_name || document?.address?.address_name || '현재 위치', address: document?.road_address?.address_name || document?.address?.address_name || '', latitude, longitude }
  },

  async getTransitRoutes(origin, destination) {
    const key = requireKey(publicApiKeys.odsayApiKey, 'ODsay API')
    if (![origin.latitude, origin.longitude, destination.latitude, destination.longitude].every(Number.isFinite)) throw new Error('출발지와 목적지의 좌표가 필요합니다.')
    const cacheKey = [origin.longitude, origin.latitude, destination.longitude, destination.latitude].map((value) => value.toFixed(5)).join(':')
    const cached = getCachedRoute(cacheKey)
    if (cached) return { ...cached, fromCache: true }
    reserveOdsayRequest()
    const url = new URL(odsayBaseUrl)
    url.search = new URLSearchParams({ SX: origin.longitude, SY: origin.latitude, EX: destination.longitude, EY: destination.latitude, OPT: '0', apiKey: key }).toString()
    const data = await requestJson(url)
    cacheRoute(cacheKey, data)
    return { ...data, fromCache: false }
  },

  async getWeatherForecast(coordinates, targetTime) {
    const key = requireKey(publicApiKeys.kmaServiceKey, '기상청 API')
    const grid = toKmaGrid(coordinates.latitude, coordinates.longitude)
    const { baseDate, baseTime } = getKmaBaseDateTime()
    const cacheKey = `weather:${grid.nx}:${grid.ny}:${baseDate}:${baseTime}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { ...cached, fromCache: true }
    const url = new URL(kmaBaseUrl)
    url.search = new URLSearchParams({ serviceKey: key, pageNo: '1', numOfRows: '1000', dataType: 'JSON', base_date: baseDate, base_time: baseTime, nx: grid.nx, ny: grid.ny }).toString()
    const data = await requestJson(url)
    const items = data.response?.body?.items?.item || []
    const weather = pickWeatherForecast(items, targetTime)
    if (!weather) throw new Error('이동 시간대의 날씨 예보를 찾지 못했습니다.')
    cacheRealtime(cacheKey, weather, REALTIME_LIMITS.weatherCacheTtlMs)
    return { ...weather, fromCache: false }
  },

  async getSubwayArrivals(stationName) {
    const key = requireKey(publicApiKeys.seoulSubwayApiKey, '서울 지하철 API')
    const cacheKey = `subway:${stationName}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { arrivals: cached, fromCache: true }
    const url = `${subwayBaseUrl}/${encodeURIComponent(key)}/json/realtimeStationArrival/0/10/${encodeURIComponent(stationName)}`
    const data = await requestJson(url)
    const arrivals = toSubwayArrivals(data, stationName)
    cacheRealtime(cacheKey, arrivals, REALTIME_LIMITS.transitCacheTtlMs)
    return { arrivals, fromCache: false }
  },

  async getBusVehiclePositions(routeId) {
    const key = requireKey(publicApiKeys.seoulBusServiceKey, '서울 버스 API')
    if (!routeId) throw new Error('버스 노선 식별자가 없습니다.')
    const cacheKey = `bus:${routeId}`
    const cached = getCachedRealtime(cacheKey)
    if (cached) return { data: cached, fromCache: true }
    const url = new URL(busBaseUrl)
    url.search = new URLSearchParams({ busRouteId: routeId, startOrd: '1', endOrd: '99', serviceKey: key, resultType: 'json' }).toString()
    const data = await requestJson(url)
    cacheRealtime(cacheKey, data, REALTIME_LIMITS.transitCacheTtlMs)
    return { data, fromCache: false }
  },
}
