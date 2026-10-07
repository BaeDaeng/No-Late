const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { action, ...params } = await request.json()
    const kakaoKey = Deno.env.get('KAKAO_REST_API_KEY')
    const external = async (url: string, headers: HeadersInit = {}) => { const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) }); if (!response.ok) { if (response.status === 401 && url.includes('ws.bus.go.kr')) throw new Error('서울 버스 노선·도착 정보 API 사용 권한이 필요합니다.'); throw new Error(`외부 API 오류 (${response.status})`) }; return response.json() }
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
    if (action === 'bus') return json(await external(`http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid?${new URLSearchParams({ busRouteId: params.routeId, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-routes') return json(await external(`http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?${new URLSearchParams({ strSrch: params.query, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-route-stops') return json(await external(`http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute?${new URLSearchParams({ busRouteId: params.routeId, ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    if (action === 'bus-arrival') return json(await external(`http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?${new URLSearchParams({ stId: params.stationId, busRouteId: params.routeId, ord: String(params.order || 1), ServiceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    return json({ error: '지원하지 않는 요청입니다.' }, 400)
  } catch (error) { return json({ error: error instanceof Error ? error.message : '요청 처리 실패' }, 502) }
})
