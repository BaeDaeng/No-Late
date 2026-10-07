import { useState } from 'react'
import { TransitNavigation } from '../components/TransitNavigation.jsx'
import { apiClient } from '../services/api/apiClient.js'

const subwaySamples = ['강남', '서울', '홍대입구', '수원']
const busSamples = ['740', '7016', '9000', 'M5107']

export function TransitInfoPage({ type, onNavigate }) {
  const isSubway = type === 'subway'
  return <main className="transit-app-shell"><header className="transit-app-header"><button className="transit-brand" type="button" onClick={() => onNavigate('/')}><span>N</span><strong>NO LATE</strong></button><TransitNavigation active={type} onNavigate={onNavigate} /></header>{isSubway ? <SubwayPage /> : <BusPage />}</main>
}

function SubwayPage() {
  const [query, setQuery] = useState('')
  const [station, setStation] = useState('')
  const [arrivals, setArrivals] = useState([])
  const [status, setStatus] = useState('')
  const search = async (nextQuery = query) => {
    const stationName = nextQuery.trim().replace(/역$/, '')
    if (!stationName) { setStatus('역 이름을 입력해 주세요.'); return }
    try { setStatus('실시간 도착 정보를 불러오는 중…'); const result = await apiClient.getSubwayArrivals(stationName); setStation(stationName); setArrivals(result.arrivals); setStatus(result.arrivals.length ? '' : '현재 도착 정보가 없습니다. 운행 전후 시간대에는 정보가 없을 수 있어요.') } catch { setArrivals([]); setStatus('지하철 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') }
  }
  return <section className="transit-page"><div className="transit-hero subway-hero"><span className="transit-kicker">수도권 지하철</span><h1>지하철 도착 정보</h1><p>역 이름으로 실시간 도착 정보를 확인하세요.</p><TransitSearch value={query} onChange={setQuery} onSubmit={search} placeholder="예: 강남역" /><QuickSearch items={subwaySamples} onSelect={(value) => { setQuery(value); search(value) }} /></div><section className="transit-results" aria-live="polite">{station && <div className="transit-result-heading"><div><span className="transit-kicker">실시간 도착</span><h2>{station}역</h2></div><span>{arrivals.length}개 열차</span></div>}{arrivals.length > 0 && <div className="arrival-list">{arrivals.map((arrival, index) => <article className="subway-arrival-card" key={`${arrival.routeId}-${arrival.direction}-${index}`}><span className={`line-dot line-${arrival.routeId.slice(-1)}`}>{subwayLineName(arrival.routeId)}</span><div><strong>{arrival.direction || '방면 정보 확인 중'}</strong><p>{arrival.message || '도착 정보를 확인 중입니다.'}</p></div><b>{arrival.arrivalInMinutes === null ? '진입 중' : `${arrival.arrivalInMinutes}분`}</b></article>)}</div>}{!station && <EmptyTransit title="역을 검색해 보세요" description="실시간 도착 열차와 방면 정보를 한눈에 보여 드려요." />}{status && <p className="transit-status" role="status">{status}</p>}</section></section>
}

function BusPage() {
  const [query, setQuery] = useState('')
  const [routes, setRoutes] = useState([])
  const [selected, setSelected] = useState(null)
  const [stops, setStops] = useState([])
  const [vehicleCount, setVehicleCount] = useState(null)
  const [selectedStop, setSelectedStop] = useState(null)
  const [arrival, setArrival] = useState(null)
  const [status, setStatus] = useState('')
  const search = async (nextQuery = query) => {
    const routeNumber = nextQuery.trim()
    if (!routeNumber) { setStatus('버스 번호를 입력해 주세요.'); return }
    try { setStatus('버스 노선을 찾는 중…'); const items = await apiClient.searchBusRoutes(routeNumber); setRoutes(items); setSelected(null); setStops([]); setArrival(null); setSelectedStop(null); setStatus(items.length ? '' : '일치하는 버스 노선이 없습니다.') } catch { setRoutes([]); setStatus('버스 노선을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') }
  }
  const chooseRoute = async (route) => {
    setSelected(route); setStops([]); setArrival(null); setSelectedStop(null); setStatus('노선과 운행 정보를 불러오는 중…')
    const [stopsResult, vehiclesResult] = await Promise.allSettled([apiClient.getBusRouteStops(route.id), apiClient.getBusVehiclePositions(route.id)])
    const routeStops = stopsResult.status === 'fulfilled' ? stopsResult.value : []
    const vehicles = vehiclesResult.status === 'fulfilled' ? vehicleItems(vehiclesResult.value.data) : []
    setStops(routeStops); setVehicleCount(vehicles.length); setStatus(routeStops.length ? '' : '정류장 또는 운행 정보를 받지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const chooseStop = async (stop) => {
    if (!selected) return
    setSelectedStop(stop); setArrival(null); setStatus('정류장 도착 정보를 확인하는 중…')
    try { const value = await apiClient.getBusArrival({ stationId: stop.id, routeId: selected.id, order: stop.order }); setArrival(value); setStatus(value ? '' : '현재 이 정류장의 도착 정보가 없습니다.') } catch { setStatus('정류장 도착 정보를 불러오지 못했습니다.') }
  }
  return <section className="transit-page"><div className="transit-hero bus-hero"><span className="transit-kicker">서울 버스 · 수도권 연계 노선</span><h1>버스 노선 정보</h1><p>버스 번호를 검색해 노선, 운행 차량, 정류장 정보를 확인하세요.</p><TransitSearch value={query} onChange={setQuery} onSubmit={search} placeholder="예: 740, M5107" /><QuickSearch items={busSamples} onSelect={(value) => { setQuery(value); search(value) }} /></div><section className="transit-results" aria-live="polite">{routes.length > 0 && <div className="bus-route-list">{routes.map((route) => <button className={`bus-route-card${selected?.id === route.id ? ' active' : ''}`} type="button" key={route.id} onClick={() => chooseRoute(route)}><b>{route.number}</b><span>{route.startName} ↔ {route.endName}</span><small>{route.intervalMinutes ? `배차 약 ${route.intervalMinutes}분` : '노선 정보'}</small></button>)}</div>}{selected && <section className="bus-detail"><div className="bus-detail-heading"><div><span className="bus-number">{selected.number}</span><h2>{selected.startName} ↔ {selected.endName}</h2></div><span>{vehicleCount === null ? '운행 정보 확인 중' : `운행 차량 ${vehicleCount}대`}</span></div>{selectedStop && arrival && <section className="bus-arrival-banner"><strong>{selectedStop.name}</strong><span>{arrival.first || '첫 차량 정보 없음'}</span>{arrival.second && <small>다음: {arrival.second}</small>}</section>}<p className="stop-guide">정류장을 누르면 이 노선의 해당 정류장 도착 정보를 확인합니다.</p><div className="bus-stop-list">{stops.map((stop) => <button className={selectedStop?.id === stop.id ? 'active' : ''} type="button" key={`${stop.id}-${stop.order}`} onClick={() => chooseStop(stop)}><b>{stop.order}</b><span>{stop.name}</span><small>{stop.arsId ? `정류장 ${stop.arsId}` : '정류장'}</small></button>)}</div></section>}{!routes.length && !status && <EmptyTransit title="버스 번호를 검색해 보세요" description="서울 버스와 서울을 지나는 수도권 연계 노선을 확인할 수 있어요." />}{status && <p className="transit-status" role="status">{status}</p>}</section></section>
}

function TransitSearch({ value, onChange, onSubmit, placeholder }) { return <form className="transit-search" onSubmit={(event) => { event.preventDefault(); onSubmit() }}><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button type="submit">검색</button></form> }
function QuickSearch({ items, onSelect }) { return <div className="quick-search">{items.map((item) => <button type="button" key={item} onClick={() => onSelect(item)}>{item}</button>)}</div> }
function EmptyTransit({ title, description }) { return <div className="transit-empty"><strong>{title}</strong><p>{description}</p></div> }
function subwayLineName(routeId) { const number = Number(String(routeId).slice(-1)); return Number.isFinite(number) && number > 0 ? `${number}호선` : '전철' }
function vehicleItems(data) { const value = data?.msgBody?.itemList; return Array.isArray(value) ? value : value ? [value] : [] }
