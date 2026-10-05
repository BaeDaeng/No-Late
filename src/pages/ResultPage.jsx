import { useEffect, useState } from 'react'
import { Loading } from '../components/Loading.jsx'
import { KakaoMap } from '../features/map/KakaoMap.jsx'
import { personalizeRoute } from '../domain/movementEstimate.js'
import { toKakaoRoutePlan } from '../services/api/adapters.js'
import { apiClient } from '../services/api/apiClient.js'
import { mockRoutePlan } from '../services/api/fixtures.js'
import { isMockMode } from '../services/api/mockAdapter.js'
import { fallbackTransitArrival, toBusVehicleStatus } from '../domain/transitArrival.js'
import { REALTIME_LIMITS } from '../config/realtimeLimits.js'

export function ResultPage({ tripRequest, onBack }) {
  const [state, setState] = useState({ loading: true, routes: [], error: null, fromCache: false })
  const [selectedId, setSelectedId] = useState(null)
  const [realtime, setRealtime] = useState({ loading: false, weather: null, arrival: null, warning: null })
  useEffect(() => {
    let active = true
    async function loadRoutes() {
      if (isMockMode) { if (active) { setState({ loading: false, routes: [mockRoutePlan], error: null, fromCache: true }); setSelectedId(mockRoutePlan.id) }; return }
      try {
        const response = await apiClient.getTransitRoutes(tripRequest.origin, tripRequest.destination)
        if (response.status !== 'OK' || !response.routes?.length) throw new Error('이동 가능한 대중교통 경로를 찾지 못했습니다.')
        const routes = response.routes.slice(0, 3).map((route, index) => personalizeRoute(toKakaoRoutePlan(route, `kakao-${index}`), tripRequest)).sort((a, b) => a.totalMinutes - b.totalMinutes)
        if (active) { setState({ loading: false, routes, error: null, fromCache: response.fromCache }); setSelectedId(routes[0].id) }
      } catch (routeError) { if (active) setState({ loading: false, routes: [], error: routeError.message, fromCache: false }) }
    }
    loadRoutes()
    return () => { active = false }
  }, [tripRequest])
  const selectedRoute = state.routes.find((route) => route.id === selectedId)
  useEffect(() => {
    if (!selectedRoute || isMockMode) return undefined
    let active = true
    async function loadRealtime() {
      setRealtime({ loading: true, weather: null, arrival: null, warning: null })
      const firstTransit = selectedRoute.segments.find((segment) => segment.type === 'subway' || segment.type === 'bus')
      const requests = [apiClient.getWeatherForecast(tripRequest.origin, tripRequest.appointmentAt)]
      if (firstTransit?.type === 'subway') requests.push(apiClient.getSubwayArrivals(firstTransit.startName))
      if (firstTransit?.type === 'bus' && firstTransit.routeId) requests.push(apiClient.getBusVehiclePositions(firstTransit.routeId))
      const [weatherResult, transitResult] = await Promise.allSettled(requests)
      if (!active) return
      const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null
      const arrival = transitResult?.status === 'fulfilled' && transitResult.value.arrivals?.length ? transitResult.value.arrivals[0] : transitResult?.status === 'fulfilled' && firstTransit?.type === 'bus' ? toBusVehicleStatus(transitResult.value.data, firstTransit.startName) : firstTransit ? fallbackTransitArrival(firstTransit.startName, REALTIME_LIMITS.fallbackWaitMinutes) : null
      const failures = [weatherResult, transitResult].filter((result) => result?.status === 'rejected').length
      setRealtime({ loading: false, weather, arrival, warning: failures || (firstTransit && firstTransit.type !== 'subway') ? '일부 실시간 정보를 받지 못해 보수적으로 계산합니다.' : null })
    }
    loadRealtime()
    return () => { active = false }
  }, [selectedRoute, tripRequest])
  if (state.loading) return <Loading message="대중교통 경로를 찾는 중입니다…" />
  if (state.error) return <main className="app-shell"><div className="page"><section className="card"><h1>경로를 불러오지 못했습니다</h1><p className="field-error">{state.error}</p><button className="button secondary" onClick={onBack}>입력 수정하기</button></section></div></main>
  return <main className="app-shell route-screen"><KakaoMap routeMode route={selectedRoute} origin={tripRequest.origin} destination={tripRequest.destination} /><section className="route-sheet"><button className="back-link" onClick={onBack}>‹ 출발지·시간 다시 입력</button><header className="route-heading"><span className="eyebrow">{isMockMode ? '예시 경로' : state.fromCache ? '저장된 경로' : '실시간 경로'}</span><h1>{tripRequest.origin.name} <span>→</span> {tripRequest.destination.name}</h1><p>경로 카드를 누르면 지도 위 표시가 해당 경로로 바뀝니다.</p></header><div className="route-cards" role="radiogroup" aria-label="추천 경로">{state.routes.map((route, index) => <RouteCard key={route.id} route={route} index={index} selected={route.id === selectedId} onSelect={() => setSelectedId(route.id)} />)}</div>{selectedRoute && <RealtimeSummary realtime={realtime} />}{selectedRoute && <RouteDetail route={selectedRoute} />}</section></main>
}

function RouteCard({ route, index, selected, onSelect }) {
  return <button className={`route-card${selected ? ' selected' : ''}`} type="button" onClick={onSelect} role="radio" aria-checked={selected}><div className="route-card-top"><span className="route-rank">{index === 0 ? '추천' : `경로 ${index + 1}`}</span><strong>{route.totalMinutes}분</strong><span className="route-chevron">›</span></div><div className="route-metrics"><span>도보 {route.totalWalkMinutes}분</span><span>환승 {route.transferCount}회</span><span>건물 밖까지 {route.buildingExitMinutes}분</span></div><div className="route-preview">{route.segments.map((segment) => <span className={`segment-chip ${segment.type}`} key={segment.id}>{segment.type === 'walk' ? '도보' : segment.label}</span>)}</div></button>
}

function RouteDetail({ route }) { return <section className="route-detail"><div className="route-detail-heading"><h2>선택한 경로</h2><span>내 걸음 기준 약 {route.totalMinutes}분</span></div>{route.segments.map((segment, index) => <div className="timeline-row" key={segment.id}><span className={`timeline-dot ${segment.type}`}>{index + 1}</span><div><strong>{segment.type === 'walk' ? '도보 이동' : segment.label}</strong><span>{segment.startName} → {segment.endName}</span><small>{segment.durationMinutes}분{segment.distanceMeters ? ` · ${segment.distanceMeters}m` : ''}</small></div></div>)}</section> }

function RealtimeSummary({ realtime }) { if (realtime.loading) return <section className="realtime-summary">날씨와 첫 대중교통 도착 정보를 확인하는 중입니다…</section>; return <section className="realtime-summary"><h2>출발 전 확인</h2>{realtime.weather && <p>날씨: {realtime.weather.precipitationType === 'rain' ? '비' : realtime.weather.precipitationType === 'snow' ? '눈' : realtime.weather.precipitationType === 'mixed' ? '비·눈' : '강수 없음'}{realtime.weather.precipitationMm ? ` · ${realtime.weather.precipitationMm}mm` : ''}</p>}{realtime.arrival && <p>{realtime.arrival.stopName}: {realtime.arrival.arrivalInMinutes === null ? realtime.arrival.message : `${realtime.arrival.arrivalInMinutes}분 후 도착`}</p>}{realtime.warning && <p className="field-hint">{realtime.warning}</p>}</section> }
