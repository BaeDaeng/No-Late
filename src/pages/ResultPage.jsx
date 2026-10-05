import { useEffect, useState } from 'react'
import { Loading } from '../components/Loading.jsx'
import { toRoutePlan } from '../services/api/adapters.js'
import { apiClient } from '../services/api/apiClient.js'
import { mockRoutePlan } from '../services/api/fixtures.js'
import { isMockMode } from '../services/api/mockAdapter.js'
import { personalizeRoute } from '../domain/movementEstimate.js'

export function ResultPage({ tripRequest, onBack }) {
  const [state, setState] = useState({ loading: true, routes: [], error: null, fromCache: false })
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => {
    let active = true
    async function loadRoutes() {
      if (isMockMode) { if (active) { setState({ loading: false, routes: [mockRoutePlan], error: null, fromCache: true }); setSelectedId(mockRoutePlan.id) }; return }
      try {
        const response = await apiClient.getTransitRoutes(tripRequest.origin, tripRequest.destination)
        if (response.error || !response.result?.path?.length) throw new Error(response.error?.[0]?.message || '이동 가능한 대중교통 경로를 찾지 못했습니다.')
        const routes = response.result.path.slice(0, 3).map((path, index) => personalizeRoute(toRoutePlan(path, `odsay-${index}`), tripRequest)).sort((a, b) => a.totalMinutes - b.totalMinutes)
        if (active) { setState({ loading: false, routes, error: null, fromCache: response.fromCache }); setSelectedId(routes[0].id) }
      } catch (routeError) { if (active) setState({ loading: false, routes: [], error: routeError.message, fromCache: false }) }
    }
    loadRoutes()
    return () => { active = false }
  }, [tripRequest])
  if (state.loading) return <Loading message="대중교통 경로를 찾는 중입니다…" />
  if (state.error) return <main className="app-shell"><div className="page"><section className="card"><h1>경로를 불러오지 못했습니다</h1><p className="field-error">{state.error}</p><button className="button secondary" onClick={onBack}>입력 수정하기</button></section></div></main>
  const selectedRoute = state.routes.find((route) => route.id === selectedId)
  return <main className="app-shell"><div className="page"><button className="button secondary" onClick={onBack}>입력으로 돌아가기</button><section className="card" style={{ marginTop: 16 }}><span className="eyebrow">{isMockMode ? 'MOCK 경로' : state.fromCache ? '저장된 경로' : '실시간 경로 조회'}</span><h1>추천 대중교통 경로</h1><p className="muted">{tripRequest.origin.name} → {tripRequest.destination.name}</p><div className="route-list" role="radiogroup" aria-label="경로 선택">{state.routes.map((route, index) => <label className="route-option" key={route.id}><input type="radio" name="route" value={route.id} checked={selectedId === route.id} onChange={() => setSelectedId(route.id)} /><strong>{index === 0 ? '가장 빠른 경로' : `대안 경로 ${index + 1}`}</strong><span>약 {route.totalMinutes}분 · 도보 {route.totalWalkMinutes}분 · 건물 밖까지 {route.buildingExitMinutes}분 · 환승 {route.transferCount}회</span></label>)}</div>{selectedRoute && <RouteTimeline route={selectedRoute} />}</section></div></main>
}

function RouteTimeline({ route }) { return <section className="timeline"><h2>구간 안내</h2>{route.segments.map((segment) => <div className="timeline-row" key={segment.id}><strong>{segment.type === 'walk' ? '도보' : segment.type === 'bus' ? '버스' : '지하철'}</strong><span>{segment.label} · {segment.durationMinutes}분</span><small>{segment.startName} → {segment.endName}</small></div>)}</section> }
