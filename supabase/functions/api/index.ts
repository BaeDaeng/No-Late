const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
let subwayMapCache: unknown = null
let subwayMapCacheExpiresAt = 0

function balancedBlock(source: string, start: number, open: string, close: string) {
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (!escaped && char === '"') quoted = false
      escaped = !escaped && char === '\\'
      continue
    }
    if (char === '"') { quoted = true; continue }
    if (char === open) depth += 1
    if (char === close) {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }
  return ''
}

function cyberField(source: string, field: string) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`"${escaped}"\\s*:\\s*"([^"]*)"`).exec(source)?.[1] || ''
}

function parseCyberStationMap(source: string) {
  const rootStart = source.indexOf('var lines')
  const firstBrace = source.indexOf('{', rootStart)
  if (rootStart < 0 || firstBrace < 0) throw new Error('공식 노선도 데이터를 읽지 못했습니다.')
  const root = balancedBlock(source, firstBrace, '{', '}')
  const lines: Array<Record<string, unknown>> = []
  let cursor = 1

  while (cursor < root.length) {
    const match = /\s*,?\s*"([^"]+)"\s*:\s*\{/.exec(root.slice(cursor))
    if (!match || match.index === undefined) break
    const key = match[1]
    const blockStart = cursor + match.index + match[0].lastIndexOf('{')
    const lineBlock = balancedBlock(root, blockStart, '{', '}')
    if (!lineBlock) break
    cursor = blockStart + lineBlock.length
    const attrIndex = lineBlock.indexOf('"attr"')
    const stationsIndex = lineBlock.indexOf('"stations"')
    if (attrIndex < 0 || stationsIndex < 0) continue
    const attrStart = lineBlock.indexOf('{', attrIndex)
    const stationsStart = lineBlock.indexOf('[', stationsIndex)
    const attributes = balancedBlock(lineBlock, attrStart, '{', '}')
    const stationsBlock = balancedBlock(lineBlock, stationsStart, '[', ']')
    const segments: Array<Array<{ x: number, y: number }>> = []
    const stations: Array<Record<string, unknown>> = []
    let stationCursor = 1
    let segment: Array<{ x: number, y: number }> = []

    while (stationCursor < stationsBlock.length) {
      const next = stationsBlock.indexOf('{', stationCursor)
      if (next < 0) break
      const stationBlock = balancedBlock(stationsBlock, next, '{', '}')
      if (!stationBlock) break
      stationCursor = next + stationBlock.length
      const coords = cyberField(stationBlock, 'data-coords').split(',').map(Number)
      if (!Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) continue
      if (cyberField(stationBlock, 'data-moveTo') && segment.length) { segments.push(segment); segment = [] }
      const point = { x: coords[0], y: coords[1] }
      segment.push(point)
      const name = cyberField(stationBlock, 'station-nm')
      if (name) stations.push({ id: cyberField(stationBlock, 'data-uid') || cyberField(stationBlock, 'station-cd') || `${key}-${stations.length}`, name, x: point.x, y: point.y, labelPos: cyberField(stationBlock, 'data-labelPos') || 'E', interchange: cyberField(stationBlock, 'data-marker') === 'interchange' })
    }
    if (segment.length) segments.push(segment)
    if (segments.length && stations.length) lines.push({ key, label: cyberField(attributes, 'data-label') || key, color: cyberField(attributes, 'data-color') || '#6b7280', width: Number(cyberField(attributes, 'data-lineWidth')) || 3, segments, stations })
  }

  const allPoints = lines.flatMap((line) => (line.segments as Array<Array<{ x: number, y: number }>>).flat())
  const width = Math.max(360, ...allPoints.map((point) => point.x + 12))
  const height = Math.max(260, ...allPoints.map((point) => point.y + 12))
  if (!lines.length) throw new Error('공식 노선도에 표시할 역이 없습니다.')
  return { width, height, lines }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { action, ...params } = await request.json()
    const kakaoKey = Deno.env.get('KAKAO_REST_API_KEY')
    const external = async (url: string, headers: HeadersInit = {}) => { const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) }); if (!response.ok) { if (response.status === 401 && url.includes('ws.bus.go.kr')) throw new Error('서울 버스 노선·도착 정보 API 사용 권한이 필요합니다.'); throw new Error(`외부 API 오류 (${response.status})`) }; return response.json() }
    const externalText = async (url: string) => { const response = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw new Error(`공식 노선도 오류 (${response.status})`); return response.text() }
    if (action === 'delete-account') {
      const origin = new URL(request.url).origin
      const response = await fetch(`${origin}/auth/v1/user`, { method: 'DELETE', headers: { apikey: request.headers.get('apikey') || '', Authorization: request.headers.get('Authorization') || '' } })
      if (!response.ok) throw new Error('회원 탈퇴를 처리하지 못했습니다.')
      return json({ ok: true })
    }
    if (action === 'kakao-public-transit') {
      const query = new URLSearchParams(params).toString()
      return json(await external(`https://dapi.kakao.com/v2/routing/publictraffic?${query}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    }
    if (action === 'kakao-place') return json(await external(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(params.query)}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    if (action === 'kakao-nearby') {
      const base = new URLSearchParams({ x: String(params.longitude), y: String(params.latitude), radius: String(Math.min(Number(params.radius) || 350, 1000)), size: '5', sort: 'distance' })
      const categories = ['SW8', 'CS2', 'CE7', 'FD6']
      const results = await Promise.all(categories.map((category) => external(`https://dapi.kakao.com/v2/local/search/category.json?${base}&category_group_code=${category}`, { Authorization: `KakaoAK ${kakaoKey}` })))
      const documents = results.flatMap((result) => result.documents || []).filter((place, index, all) => all.findIndex((item) => item.id === place.id) === index).sort((a, b) => Number(a.distance || Infinity) - Number(b.distance || Infinity))
      return json({ documents })
    }
    if (action === 'kakao-reverse') return json(await external(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${params.longitude}&y=${params.latitude}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    if (action === 'weather') {
      const query = new URLSearchParams({ serviceKey: Deno.env.get('KMA_SERVICE_KEY') || '', pageNo: '1', numOfRows: '1000', dataType: 'JSON', base_date: params.baseDate, base_time: params.baseTime, nx: params.nx, ny: params.ny })
      return json(await external(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${query}`))
    }
    if (action === 'subway') return json(await external(`http://swopenAPI.seoul.go.kr/api/subway/${Deno.env.get('SEOUL_SUBWAY_API_KEY')}/json/realtimeStationArrival/0/10/${encodeURIComponent(params.stationName)}`))
    if (action === 'subway-line-stations') return json(await external(`http://openapi.seoul.go.kr:8088/${Deno.env.get('SEOUL_SUBWAY_STATION_API_KEY')}/json/SearchSTNBySubwayLineInfo/1/1000/`))
    if (action === 'subway-map') {
      if (subwayMapCache && subwayMapCacheExpiresAt > Date.now()) return json(subwayMapCache)
      subwayMapCache = parseCyberStationMap(await externalText('http://www.seoulmetro.co.kr/kr/getLineData.do'))
      subwayMapCacheExpiresAt = Date.now() + (24 * 60 * 60 * 1000)
      return json(subwayMapCache)
    }
    if (action === 'bus') return json(await external(`http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid?${new URLSearchParams({ busRouteId: params.routeId, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-routes') return json(await external(`http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?${new URLSearchParams({ strSrch: params.query, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-route-stops') return json(await external(`http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute?${new URLSearchParams({ busRouteId: params.routeId, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-arrival') return json(await external(`http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?${new URLSearchParams({ stId: params.stationId, busRouteId: params.routeId, ord: String(params.order || 1), ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    return json({ error: '지원하지 않는 요청입니다.' }, 400)
  } catch (error) { return json({ error: error instanceof Error ? error.message : '요청 처리 실패' }, 502) }
})
