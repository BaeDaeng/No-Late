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
    setMapSelection({ place, target, id: `${target}:${place.id}:${Date.now()}` })
    setMapTarget(target === 'origin' ? 'destination' : 'origin')
  }
  const toggleFavoritePlace = async (place) => {
    if (!isRegistered) return { message: '즐겨찾기는 로그인 후 사용할 수 있어요.' }
    const favorites = profile?.favoritePlaces || []
    const exists = favorites.some((item) => item.id === place.id)
    try { await onSaveProfile({ favoritePlaces: exists ? favorites.filter((item) => item.id !== place.id) : [...favorites, place] }); return { message: exists ? '즐겨찾기에서 뺐어요.' : '즐겨찾기에 추가했어요.' } } catch { return { message: '즐겨찾기를 저장하지 못했습니다.' } }
  }
  return <main className="app-shell map-first-shell"><header className="map-header"><span className="brand-mark">N</span><strong>NO LATE</strong><TransitNavigation active="route" onNavigate={onNavigate} /></header><KakaoMap selectionTarget={mapTarget} onSelectPlace={chooseMapPlace} favoritePlaces={profile?.favoritePlaces || []} onToggleFavorite={toggleFavoritePlace} isRegistered={isRegistered} /><aside className={`map-side-panel mobile-sheet ${sheetMode}`}><button className="sheet-handle" type="button" aria-label="길찾기 패널 크기 조절" onTouchStart={(event) => { dragStartY.current = event.touches[0].clientY }} onTouchEnd={(event) => { if (dragStartY.current === null) return; const delta = event.changedTouches[0].clientY - dragStartY.current; if (Math.abs(delta) > 35) changeSheet(delta > 0 ? -1 : 1); dragStartY.current = null }} onClick={() => changeSheet(sheetMode === 'full' ? -1 : 1)}><i /></button><header className="map-search-heading"><span className="eyebrow">대중교통 길찾기</span><h1>어디로 갈까요?</h1><p>검색하거나 지도에서 지점을 눌러 출발지와 도착지를 정하세요.</p></header><TripRequestForm onComplete={onComplete} onError={onError} profile={profile} isRegistered={isRegistered} mapSelection={mapSelection} onMapSelectionHandled={() => setMapSelection(null)} mapTarget={mapTarget} onMapTargetChange={setMapTarget} /></aside></main>
}
