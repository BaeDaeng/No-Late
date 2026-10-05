import { publicApiKeys } from '../../config/publicApiKeys.js'
import { cacheRoute, getCachedRoute, reserveOdsayRequest } from './requestCache.js'

const kakaoBaseUrl = 'https://dapi.kakao.com/v2/local'
const odsayBaseUrl = 'https://api.odsay.com/v1/api/searchPubTransPathT'

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`요청에 실패했습니다. (${response.status})`)
  return response.json()
}

function requireKey(value, label) {
  if (!value) throw new Error(`${label} 키가 설정되지 않았습니다.`)
  return value
}

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
}
