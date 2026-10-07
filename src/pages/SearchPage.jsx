import { useRef, useState } from 'react'
import { TripRequestForm } from '../features/search/TripRequestForm.jsx'
import { KakaoMap } from '../features/map/KakaoMap.jsx'
import { TransitNavigation } from '../components/TransitNavigation.jsx'

export function SearchPage({ onComplete, onError, profile, isRegistered, onSaveProfile, onNavigate }) {
  const [mapTarget, setMapTarget] = useState('origin')
  const [mapSelection, setMapSelection] = useState(null)
  const [sheetMode, setSheetMode] = useState('half')
  const dragStartY = useRef(null)
  const changeSheet = (direction) => setSheetMode((current) => { const levels = ['peek', 'half', 'full']; const next = Math.max(0, Math.min(levels.length - 1, levels.indexOf(current) + direction)); return levels[next] })
  const chooseMapPlace = async (place, target) => {
    if ((target === 'home' || target === 'work') && isRegistered) { try { await onSaveProfile({ [target]: place }); setMapTarget('origin') } catch (error) { onError(error) }; return }
    setMapSelection({ place, target, id: `${target}:${place.id}:${Date.now()}` })
    setMapTarget(target === 'origin' ? 'destination' : 'origin')
  }
  return <main className="app-shell map-first-shell"><header className="map-header"><span className="brand-mark">N</span><strong>NO LATE</strong><TransitNavigation active="route" onNavigate={onNavigate} /></header><KakaoMap selectionTarget={mapTarget} onSelectPlace={chooseMapPlace} /><aside className={`map-side-panel mobile-sheet ${sheetMode}`}><button className="sheet-handle" type="button" aria-label="길찾기 패널 크기 조절" onTouchStart={(event) => { dragStartY.current = event.touches[0].clientY }} onTouchEnd={(event) => { if (dragStartY.current === null) return; const delta = event.changedTouches[0].clientY - dragStartY.current; if (Math.abs(delta) > 35) changeSheet(delta > 0 ? -1 : 1); dragStartY.current = null }} onClick={() => changeSheet(sheetMode === 'full' ? -1 : 1)}><i /><span>{sheetMode === 'peek' ? '끌어올려 길찾기' : sheetMode === 'full' ? '끌어내려 지도 보기' : '위로 끌어 전체 보기'}</span></button><header className="map-search-heading"><span className="eyebrow">대중교통 길찾기</span><h1>어디로 갈까요?</h1><p>검색하거나 지도에서 지점을 눌러 출발지와 도착지를 정하세요.</p></header><TripRequestForm onComplete={onComplete} onError={onError} profile={profile} isRegistered={isRegistered} mapSelection={mapSelection} onMapSelectionHandled={() => setMapSelection(null)} mapTarget={mapTarget} onMapTargetChange={setMapTarget} /></aside></main>
}
