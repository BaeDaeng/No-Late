import { useEffect, useMemo, useState } from 'react'
import { Loading } from '../components/Loading.jsx'
import { KakaoMap } from '../features/map/KakaoMap.jsx'
import { personalizeRoute } from '../domain/movementEstimate.js'
import { calculateTripPrediction } from '../domain/prediction/calculateTripPrediction.js'
import { getArrivalLikelihood } from '../domain/prediction/arrivalLikelihood.js'
import { toKakaoRoutePlan } from '../services/api/adapters.js'
import { apiClient } from '../services/api/apiClient.js'
import { mockRoutePlan } from '../services/api/fixtures.js'
import { isMockMode } from '../services/api/mockAdapter.js'
import { fallbackTransitArrival, selectSubwayArrival, toBusVehicleStatus } from '../domain/transitArrival.js'
import { REALTIME_LIMITS } from '../config/realtimeLimits.js'
import { createSharedTrip, savePlacePair } from '../services/trips/tripStore.js'

const formatTime = (value) => new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
const paceOptions = [
  { id: 'relaxed', label: '느긋하게', hint: '여유 있게 걷기' },
  { id: 'normal', label: '평범하게', hint: '평소 걸음' },
  { id: 'hurry', label: '서둘러서', hint: '필요하면 뛰기' },
]

export function ResultPage({ tripRequest, onBack, isRegistered = false }) {
  const [state, setState] = useState({ loading: true, routes: [], error: null, fromCache: false })
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPace, setSelectedPace] = useState('normal')
  const [realtime, setRealtime] = useState({ loading: false, weather: null, arrival: null, warning: null })
  const [now, setNow] = useState(() => new Date())
  const [shareStatus, setShareStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    let active = true
    async function loadRoutes() {
      if (isMockMode) { if (active) { const route = personalizeRoute(mockRoutePlan, { ...tripRequest, urgency: 'normal' }); setState({ loading: false, routes: [{ ...route, rawRoute: mockRoutePlan }], error: null, fromCache: true }); setSelectedId(route.id) }; return }
      try {
        const response = await apiClient.getTransitRoutes(tripRequest.origin, tripRequest.destination)
        if (response.status !== 'OK' || !response.routes?.length) throw new Error('이동 가능한 대중교통 경로를 찾지 못했습니다.')
        const routes = response.routes.slice(0, 3).map((route, index) => { const rawRoute = toKakaoRoutePlan(route, `kakao-${index}`); return { ...personalizeRoute(rawRoute, { ...tripRequest, urgency: 'normal' }), rawRoute } }).sort((a, b) => a.totalMinutes - b.totalMinutes)
        if (active) { setState({ loading: false, routes, error: null, fromCache: response.fromCache }); setSelectedId(routes[0].id) }
      } catch (routeError) { if (active) setState({ loading: false, routes: [], error: routeError.message, fromCache: false }) }
    }
    loadRoutes(); return () => { active = false }
  }, [tripRequest])
  const selectedRoute = state.routes.find((route) => route.id === selectedId)
  useEffect(() => {
    if (!selectedRoute || isMockMode) return undefined
    let active = true
    async function loadRealtime() {
      setRealtime({ loading: true, weather: null, arrival: null, warning: null })
      const firstTransit = selectedRoute.segments.find((segment) => segment.type === 'subway' || segment.type === 'bus')
      const requests = [apiClient.getWeatherForecast(tripRequest.origin, tripRequest.appointmentAt || new Date().toISOString())]
      if (firstTransit?.type === 'subway') requests.push(apiClient.getSubwayArrivals(firstTransit.startName))
      if (firstTransit?.type === 'bus' && firstTransit.routeId) requests.push(apiClient.getBusVehiclePositions(firstTransit.routeId))
      const [weatherResult, transitResult] = await Promise.allSettled(requests)
      if (!active) return
      const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null
      const matchedSubwayArrival = transitResult?.status === 'fulfilled' && firstTransit?.type === 'subway' ? selectSubwayArrival(transitResult.value.arrivals, firstTransit.label) : null
      const arrival = matchedSubwayArrival || (transitResult?.status === 'fulfilled' && firstTransit?.type === 'bus' ? toBusVehicleStatus(transitResult.value.data, firstTransit.startName) : firstTransit ? fallbackTransitArrival(firstTransit.startName, REALTIME_LIMITS.fallbackWaitMinutes) : null)
      const failures = [weatherResult, transitResult].filter((result) => result?.status === 'rejected').length
      const needsConservativeNotice = failures || (firstTransit && (firstTransit.type !== 'subway' || !matchedSubwayArrival))
      setRealtime({ loading: false, weather, arrival, warning: needsConservativeNotice ? '일부 실시간 정보를 받지 못해 보수적으로 계산합니다.' : null })
    }
    loadRealtime(); return () => { active = false }
  }, [selectedRoute, tripRequest])
  const pacePredictions = useMemo(() => selectedRoute ? paceOptions.map((pace) => { const paceRequest = { ...tripRequest, urgency: pace.id }; const paceRoute = personalizeRoute(selectedRoute.rawRoute || selectedRoute, paceRequest); return { ...pace, route: paceRoute, prediction: calculateTripPrediction({ route: paceRoute, tripRequest: paceRequest, weather: realtime.weather, arrival: realtime.arrival, now }) } }) : [], [selectedRoute, tripRequest, realtime, now])
  const activePace = pacePredictions.find((pace) => pace.id === selectedPace) || pacePredictions[1] || null
  const prediction = activePace?.prediction || null
  const share = async () => { try { setShareStatus('공유 링크를 만드는 중…'); const id = await createSharedTrip({ tripRequest, route: selectedRoute, prediction }); const url = `${window.location.origin}/share/${id}`; if (navigator.share) await navigator.share({ title: 'NO LATE 출발 안내', url }); else await navigator.clipboard.writeText(url); setShareStatus(navigator.share ? '공유 창을 열었습니다.' : '공유 링크를 복사했습니다. 24시간 뒤 만료됩니다.') } catch { setShareStatus('공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.') } }
  const save = async () => { if (!isRegistered) { setSaveStatus('로그인하면 출발지와 도착지를 저장할 수 있어요.'); return }; try { setSaveStatus('출발지·도착지를 저장하는 중…'); await savePlacePair({ origin: tripRequest.origin, destination: tripRequest.destination }); setSaveStatus('출발지와 도착지를 저장했어요. 다음에는 약속 시간만 입력하면 됩니다.') } catch { setSaveStatus('출발지와 도착지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.') } }
  if (state.loading) return <Loading message="대중교통 경로를 찾는 중입니다…" />
  if (state.error) return <main className="app-shell"><div className="page"><section className="card"><h1>경로를 불러오지 못했습니다</h1><p className="field-error">{state.error}</p><button className="button secondary" onClick={onBack}>입력 수정하기</button></section></div></main>
  return <main className="app-shell route-screen"><KakaoMap routeMode route={selectedRoute} origin={tripRequest.origin} destination={tripRequest.destination} /><section className="route-sheet"><button className="back-link" onClick={onBack}>‹ 출발지·시간 다시 입력</button><header className="route-heading"><span className="eyebrow">{isMockMode ? '예시 경로' : state.fromCache ? '저장된 경로' : '실시간 경로'}</span><h1>{tripRequest.origin.name} <span>→</span> {tripRequest.destination.name}</h1><p>경로 카드를 누르면 지도 위 표시가 해당 경로로 바뀝니다.</p></header>{prediction && <><DepartureOverview pacePredictions={pacePredictions} activePace={activePace} appointmentAt={tripRequest.appointmentAt} onSelectPace={setSelectedPace} /><div className="result-actions"><button className="button secondary" type="button" onClick={save}>{isRegistered ? '출발지·도착지 저장' : '로그인 후 장소 저장'}</button><button className="button secondary" type="button" onClick={share}>결과 공유</button></div>{saveStatus && <p className="field-hint" role="status">{saveStatus}</p>}{shareStatus && <p className="field-hint" role="status">{shareStatus}</p>}</>}<div className="route-cards" role="radiogroup" aria-label="추천 경로">{state.routes.map((route, index) => <RouteCard key={route.id} route={route} index={index} selected={route.id === selectedId} onSelect={() => setSelectedId(route.id)} />)}</div>{selectedRoute && <RealtimeSummary realtime={realtime} />}{prediction && <details className="prediction-details"><summary>시간 계산과 안전 여유 자세히 보기</summary><PredictionDetail prediction={prediction} appointmentAt={tripRequest.appointmentAt} /><AdjustmentDetail prediction={prediction} /></details>}{selectedRoute && <RouteDetail route={selectedRoute} />}</section></main>
}

function DepartureOverview({ pacePredictions, activePace, appointmentAt, onSelectPace }) { const prediction = activePace.prediction; const hasAppointment = Boolean(appointmentAt); const likelihood = getArrivalLikelihood(prediction.riskScore); return <section className={`departure-overview risk-${likelihood.tone}`} aria-live="polite"><div className="overview-context"><span>{hasAppointment ? `오늘 ${formatTime(appointmentAt)} 약속` : '약속 시간 없이 경로 보기'}</span><span>선택 경로 {activePace.route.totalMinutes}분</span></div><div className="departure-hero"><div><span className="prediction-label">{hasAppointment ? `${activePace.label} 기준 출발 마감` : `${activePace.label} 기준 안전 예상`}</span><strong>{hasAppointment ? formatTime(prediction.leaveByTime) : `${prediction.safeMinutes}분`}</strong><p>{hasAppointment ? prediction.minutesUntilLeave < 0 ? `${Math.abs(prediction.minutesUntilLeave)}분 지났어요` : `${prediction.minutesUntilLeave}분 남았어요` : `빠르면 ${prediction.optimisticMinutes}분`}</p></div>{hasAppointment && <span className={`risk-badge ${likelihood.tone}`}>{likelihood.label}</span>}</div><div className="pace-options" role="radiogroup" aria-label={hasAppointment ? '이동 속도별 출발 시간' : '이동 속도별 예상 시간'}>{pacePredictions.map((pace) => <button className={pace.id === activePace.id ? 'active' : ''} type="button" key={pace.id} role="radio" aria-checked={pace.id === activePace.id} onClick={() => onSelectPace(pace.id)}><span>{pace.label}</span><strong>{hasAppointment ? formatTime(pace.prediction.leaveByTime) : `${pace.prediction.safeMinutes}분`}</strong><small>{hasAppointment ? `${pace.prediction.safeMinutes}분 · ${pace.hint}` : `빠르면 ${pace.prediction.optimisticMinutes}분 · ${pace.hint}`}</small></button>)}</div></section> }
function PredictionDetail({ prediction, appointmentAt }) { const hasAppointment = Boolean(appointmentAt); const likelihood = getArrivalLikelihood(prediction.riskScore); return <section className="prediction-summary"><span className="prediction-label">선택한 속도 기준</span><strong>안전하게 {prediction.safeMinutes}분</strong><p>{hasAppointment ? `약속 ${formatTime(appointmentAt)} · 빠르면 ${prediction.optimisticMinutes}분` : `약속 시간 없이 보기 · 빠르면 ${prediction.optimisticMinutes}분`}</p>{hasAppointment && <div><span>{likelihood.label}</span></div>}<small>도착 가능성은 출발 마감까지 남은 시간과 이동 여유를 바탕으로 안내합니다.</small></section> }
function RouteCard({ route, index, selected, onSelect }) { return <button className={`route-card${selected ? ' selected' : ''}`} type="button" onClick={onSelect} role="radio" aria-checked={selected}><div className="route-card-top"><span className="route-rank">{index === 0 ? '추천 경로' : `경로 ${index + 1}`}</span><strong>{route.totalMinutes}<small>분</small></strong><span className="route-chevron">›</span></div><div className="route-metrics"><span>도보 {route.totalWalkMinutes}분</span><span>환승 {route.transferCount}회</span><span>건물 밖까지 {route.buildingExitMinutes}분</span></div><div className="route-preview">{route.segments.map((segment) => <span className={`segment-chip ${segment.type}`} key={segment.id}><b>{segment.type === 'walk' ? '도보' : segment.type === 'subway' ? '지하철' : '버스'}</b>{segment.type === 'walk' ? `${segment.durationMinutes}분` : segment.label}</span>)}</div></button> }
function AdjustmentDetail({ prediction }) { return <section className="adjustment-detail"><h2>시간 계산 근거</h2>{prediction.adjustmentBreakdown.map((item) => <p key={`${item.label}-${item.reason}`}><strong>{item.label} +{item.minutes}분</strong><span>{item.reason}</span></p>)}{prediction.runningSuggestionMinutes > 0 && <p><strong>서두르면 약 {prediction.runningSuggestionMinutes}분 단축</strong><span>차량 탑승시간은 줄이지 않고 도보에서만 반영합니다.</span></p>}</section> }
function RouteDetail({ route }) { return <section className="route-detail"><div className="route-detail-heading"><h2>선택한 경로</h2><span>내 걸음 기준 약 {route.totalMinutes}분</span></div>{route.segments.map((segment) => <div className="timeline-row" key={segment.id}><span className={`timeline-dot ${segment.type}`}>{segment.type === 'walk' ? '걷기' : segment.type === 'subway' ? '전철' : '버스'}</span><div><strong>{segment.type === 'walk' ? '도보 이동' : segment.label}</strong><span>{segment.startName} → {segment.endName}</span><small>{segment.durationMinutes}분{segment.distanceMeters ? ` · ${segment.distanceMeters}m` : ''}</small></div></div>)}</section> }
function RealtimeSummary({ realtime }) { if (realtime.loading) return <section className="realtime-summary">날씨와 첫 대중교통 도착 정보를 확인하는 중입니다…</section>; return <section className="realtime-summary"><h2>출발 전 확인</h2>{realtime.weather && <p>날씨: {realtime.weather.precipitationType === 'rain' ? '비' : realtime.weather.precipitationType === 'snow' ? '눈' : realtime.weather.precipitationType === 'mixed' ? '비·눈' : '강수 없음'}{realtime.weather.precipitationMm ? ` · ${realtime.weather.precipitationMm}mm` : ''}</p>}{realtime.arrival && <p>{realtime.arrival.stopName}: {realtime.arrival.arrivalInMinutes === null ? realtime.arrival.message : `${realtime.arrival.arrivalInMinutes}분 후 도착`}</p>}{realtime.warning && <p className="field-hint">{realtime.warning}</p>}</section> }
