import { useEffect, useMemo, useRef, useState } from 'react'
import { TransitNavigation } from '../components/TransitNavigation.jsx'
import { apiClient } from '../services/api/apiClient.js'
import { subwayLineColor, subwayLineLabel } from '../domain/transitArrival.js'

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
  const [map, setMap] = useState(null)
  const [mapStatus, setMapStatus] = useState('공식 노선도를 준비하는 중…')
  const [mapScale, setMapScale] = useState(2.2)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const mapCanvasRef = useRef(null)
  const gestureRef = useRef(null)

  useEffect(() => {
    let active = true
    apiClient.getSubwayMap().then((nextMap) => {
      if (!active) return
      setMap(nextMap)
      setMapStatus('')
    }).catch(() => {
      if (active) setMapStatus('공식 노선도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!map) return
    const frame = requestAnimationFrame(() => {
      const canvas = mapCanvasRef.current
      if (!canvas) return
      canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2)
      canvas.scrollTop = Math.max(0, (canvas.scrollHeight - canvas.clientHeight) / 2)
    })
    return () => cancelAnimationFrame(frame)
  }, [map])

  const suggestions = useMemo(() => {
    const keyword = query.trim().replace(/역$/, '')
    if (!keyword) return []
    return [...new Set((map?.lines || []).flatMap((line) => line.stations.map((item) => item.name)).filter((name) => name.includes(keyword)))].slice(0, 8)
  }, [map, query])

  const search = async (nextQuery = query) => {
    const stationName = nextQuery.trim().replace(/역$/, '')
    if (!stationName) { setStatus('역 이름을 입력해 주세요.'); return }
    setShowSuggestions(false)
    setStation(stationName)
    setArrivals([])
    try {
      setStatus('실시간 도착 정보를 불러오는 중…')
      const result = await apiClient.getSubwayArrivals(stationName)
      setArrivals(result.arrivals)
      setStatus(result.arrivals.length ? '' : '현재 도착 정보가 없습니다. 운행 전후 시간대에는 정보가 없을 수 있어요.')
    } catch {
      setArrivals([])
      setStatus('지하철 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const selectStation = (stationName) => {
    setQuery(stationName)
    search(stationName)
  }

  const updateScale = (amount) => setMapScale((current) => Math.max(1.1, Math.min(3.6, Number((current + amount).toFixed(2)))))
  const onMapWheel = (event) => { event.preventDefault(); updateScale(event.deltaY < 0 ? 0.14 : -0.14) }
  const onMapTouchStart = (event) => {
    const canvas = mapCanvasRef.current
    if (!canvas) return
    if (event.touches.length === 2) {
      const [first, second] = event.touches
      gestureRef.current = { kind: 'pinch', distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY), scale: mapScale }
      return
    }
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      gestureRef.current = { kind: 'pan', x: touch.clientX, y: touch.clientY, left: canvas.scrollLeft, top: canvas.scrollTop }
    }
  }
  const onMapTouchMove = (event) => {
    const canvas = mapCanvasRef.current
    const gesture = gestureRef.current
    if (!canvas || !gesture) return
    if (gesture.kind === 'pinch' && event.touches.length === 2) {
      event.preventDefault()
      const [first, second] = event.touches
      const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
      setMapScale(Math.max(1.1, Math.min(3.6, Number((gesture.scale * (distance / gesture.distance)).toFixed(2)))))
      return
    }
    if (gesture.kind === 'pan' && event.touches.length === 1) {
      event.preventDefault()
      const touch = event.touches[0]
      canvas.scrollLeft = gesture.left - (touch.clientX - gesture.x)
      canvas.scrollTop = gesture.top - (touch.clientY - gesture.y)
    }
  }

  return <section className="transit-page subway-page">
    <div className="subway-search-bar">
      <form className="subway-station-search" onSubmit={(event) => { event.preventDefault(); search() }}>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)} placeholder="역 이름 검색" aria-label="지하철역 검색" />
        <button type="submit">검색</button>
      </form>
      {showSuggestions && suggestions.length > 0 && <div className="subway-suggestions" role="listbox">{suggestions.map((stationName) => <button key={stationName} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectStation(stationName)}>{stationName}역</button>)}</div>}
    </div>
    <section className="subway-map-stage" aria-label="서울 수도권 지하철 전체 노선도">
      <div className="subway-map-canvas" ref={mapCanvasRef} onWheel={onMapWheel} onTouchStart={onMapTouchStart} onTouchMove={onMapTouchMove} onTouchEnd={() => { gestureRef.current = null }} onTouchCancel={() => { gestureRef.current = null }}>{map ? <InteractiveSubwayMap map={map} scale={mapScale} onSelect={selectStation} /> : <p className="subway-map-loading">{mapStatus}</p>}</div>
      <div className="subway-map-floating-controls" aria-label="노선도 확대 및 축소"><button type="button" onClick={() => updateScale(0.14)} aria-label="노선도 확대">+</button><button type="button" onClick={() => updateScale(-0.14)} aria-label="노선도 축소">−</button><button className="map-fit" type="button" onClick={() => setMapScale(1.5)}>맞춤</button></div>
      {(station || status) && <aside className="subway-station-sheet" aria-live="polite"><div className="subway-station-sheet-heading"><div><span>실시간 도착</span><strong>{station ? `${station}역` : '역 정보'}</strong></div><button type="button" onClick={() => { setStation(''); setArrivals([]); setStatus('') }} aria-label="역 정보 닫기">×</button></div>{arrivals.length > 0 && <div className="subway-sheet-arrivals">{arrivals.map((arrival, index) => <article key={`${arrival.routeId}-${arrival.direction}-${index}`}><span className="line-dot" style={{ backgroundColor: subwayLineColor(arrival.routeId) }}>{subwayLineLabel(arrival.routeId)}</span><div><strong>{arrival.direction || '방면 정보 확인 중'}</strong><p>{arrival.message || '도착 정보를 확인 중입니다.'}</p></div><b>{arrival.arrivalInMinutes === null ? '진입 중' : `${arrival.arrivalInMinutes}분`}</b></article>)}</div>}{status && <p className="subway-sheet-status">{status}</p>}</aside>}
    </section>
  </section>
}

function InteractiveSubwayMap({ map, scale, onSelect }) {
  return <svg className="interactive-subway-map" viewBox={`0 0 ${map.width} ${map.height}`} style={{ width: `${scale * 100}%` }} role="group" aria-label="서울 수도권 지하철 노선도. 역을 누르면 도착 정보를 확인합니다.">{map.lines.map((line) => <g key={line.key} className="subway-map-line"><title>{line.label}</title>{line.segments.map((segment, index) => <polyline key={index} points={segment.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={line.color} strokeWidth={line.width} strokeLinecap="round" strokeLinejoin="round" />)}{line.stations.map((item) => { const label = stationLabel(item); return <g className={`subway-map-station${item.interchange ? ' interchange' : ''}`} key={`${line.key}-${item.id}`} role="button" tabIndex="0" aria-label={`${item.name}역 도착 정보 보기`} onClick={() => onSelect(item.name)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.name) } }}><circle className="station-hit-area" cx={item.x} cy={item.y} r="5" /><circle cx={item.x} cy={item.y} r={item.interchange ? '2.5' : '1.8'} /><text x={item.x + label.x} y={item.y + label.y} textAnchor={label.anchor}>{item.name}</text></g> })}</g>)}</svg>
}

function stationLabel({ labelPos }) {
  const position = String(labelPos || 'E').toUpperCase()
  if (position === 'N') return { x: 0, y: -3.6, anchor: 'middle' }
  if (position === 'S') return { x: 0, y: 5.6, anchor: 'middle' }
  if (position === 'W') return { x: -3.2, y: 1.1, anchor: 'end' }
  if (position === 'NE') return { x: 2.8, y: -2.2, anchor: 'start' }
  if (position === 'NW') return { x: -2.8, y: -2.2, anchor: 'end' }
  if (position === 'SE') return { x: 2.8, y: 4.2, anchor: 'start' }
  if (position === 'SW') return { x: -2.8, y: 4.2, anchor: 'end' }
  return { x: 3.2, y: 1.1, anchor: 'start' }
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
  return <section className="transit-page"><div className="transit-hero bus-hero"><span className="transit-kicker">서울 버스 · 수도권 연계 노선</span><h1>버스 노선 정보</h1><p>버스 번호를 검색해 노선, 운행 차량, 정류장 정보를 확인하세요.</p><TransitSearch value={query} onChange={setQuery} onSubmit={search} placeholder="예: 740, M5107" /><QuickSearch items={busSamples} onSelect={(value) => { setQuery(value); search(value) }} /><CurrentLocation /></div><section className="transit-results" aria-live="polite">{routes.length > 0 && <div className="bus-route-list">{routes.map((route) => <button className={`bus-route-card${selected?.id === route.id ? ' active' : ''}`} type="button" key={route.id} onClick={() => chooseRoute(route)}><b>{route.number}</b><span>{route.startName} ↔ {route.endName}</span><small>{route.intervalMinutes ? `배차 약 ${route.intervalMinutes}분` : '노선 정보'}</small></button>)}</div>}{selected && <section className="bus-detail"><div className="bus-detail-heading"><div><span className="bus-number">{selected.number}</span><h2>{selected.startName} ↔ {selected.endName}</h2></div><span>{vehicleCount === null ? '운행 정보 확인 중' : `운행 차량 ${vehicleCount}대`}</span></div>{selectedStop && arrival && <section className="bus-arrival-banner"><strong>{selectedStop.name}</strong><span>{arrival.first || '첫 차량 정보 없음'}</span>{arrival.second && <small>다음: {arrival.second}</small>}</section>}<p className="stop-guide">정류장을 누르면 이 노선의 해당 정류장 도착 정보를 확인합니다.</p><div className="bus-stop-list">{stops.map((stop) => <button className={selectedStop?.id === stop.id ? 'active' : ''} type="button" key={`${stop.id}-${stop.order}`} onClick={() => chooseStop(stop)}><b>{stop.order}</b><span>{stop.name}</span><small>{stop.arsId ? `정류장 ${stop.arsId}` : '정류장'}</small></button>)}</div></section>}{!routes.length && !status && <EmptyTransit title="버스 번호를 검색해 보세요" description="서울 버스와 서울을 지나는 수도권 연계 노선을 확인할 수 있어요." />}{status && <p className="transit-status" role="status">{status}</p>}</section></section>
}

function TransitSearch({ value, onChange, onSubmit, placeholder }) { return <form className="transit-search" onSubmit={(event) => { event.preventDefault(); onSubmit() }}><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button type="submit">검색</button></form> }
function QuickSearch({ items, onSelect }) { return <div className="quick-search">{items.map((item) => <button type="button" key={item} onClick={() => onSelect(item)}>{item}</button>)}</div> }
function CurrentLocation() { const [message, setMessage] = useState(''); const locate = () => { if (!navigator.geolocation) { setMessage('이 브라우저에서는 위치 확인을 지원하지 않습니다.'); return }; setMessage('현재 위치를 확인하는 중…'); navigator.geolocation.getCurrentPosition((position) => setMessage(`현재 위치 확인됨 · ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`), () => setMessage('위치 권한을 허용하면 현재 위치를 확인할 수 있어요.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }) }; return <div className="transit-location"><button type="button" onClick={locate}>현재 위치 표시</button>{message && <span>{message}</span>}</div> }
function EmptyTransit({ title, description }) { return <div className="transit-empty"><strong>{title}</strong><p>{description}</p></div> }
function vehicleItems(data) { const value = data?.msgBody?.itemList; return Array.isArray(value) ? value : value ? [value] : [] }
