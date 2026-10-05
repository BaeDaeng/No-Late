const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { action, ...params } = await request.json()
    const kakaoKey = Deno.env.get('KAKAO_REST_API_KEY')
    const external = async (url: string, headers: HeadersInit = {}) => { const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) }); if (!response.ok) throw new Error(`외부 API 오류 (${response.status})`); return response.json() }
    if (action === 'kakao-public-transit') {
      const query = new URLSearchParams(params).toString()
      return json(await external(`https://dapi.kakao.com/v2/routing/publictraffic?${query}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    }
    if (action === 'kakao-place') return json(await external(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(params.query)}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    if (action === 'kakao-reverse') return json(await external(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${params.longitude}&y=${params.latitude}`, { Authorization: `KakaoAK ${kakaoKey}` }))
    if (action === 'odsay') {
      const query = new URLSearchParams({ SX: params.SX, SY: params.SY, EX: params.EX, EY: params.EY, OPT: '0', apiKey: Deno.env.get('ODSAY_API_KEY') || '' })
      return json(await external(`https://api.odsay.com/v1/api/searchPubTransPathT?${query}`))
    }
    if (action === 'weather') {
      const query = new URLSearchParams({ serviceKey: Deno.env.get('KMA_SERVICE_KEY') || '', pageNo: '1', numOfRows: '1000', dataType: 'JSON', base_date: params.baseDate, base_time: params.baseTime, nx: params.nx, ny: params.ny })
      return json(await external(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${query}`))
    }
    if (action === 'subway') return json(await external(`http://swopenAPI.seoul.go.kr/api/subway/${Deno.env.get('SEOUL_SUBWAY_API_KEY')}/json/realtimeStationArrival/0/10/${encodeURIComponent(params.stationName)}`))
    if (action === 'bus') return json(await external(`http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid?${new URLSearchParams({ busRouteId: params.routeId, serviceKey: Deno.env.get('SEOUL_BUS_SERVICE_KEY') || '', resultType: 'json' })}`))
    return json({ error: '지원하지 않는 요청입니다.' }, 400)
  } catch (error) { return json({ error: error instanceof Error ? error.message : '요청 처리 실패' }, 502) }
})
