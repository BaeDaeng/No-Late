import { useState } from 'react'
import { TripRequestForm } from '../features/search/TripRequestForm.jsx'
import { KakaoMap } from '../features/map/KakaoMap.jsx'
import { TransitNavigation } from '../components/TransitNavigation.jsx'

export function SearchPage({ onComplete, onError, profile, isRegistered, onSaveProfile, onNavigate }) {
  const [mapTarget, setMapTarget] = useState('origin')
  const [mapSelection, setMapSelection] = useState(null)
  const chooseMapPlace = async (place, target) => {
    if ((target === 'home' || target === 'work') && isRegistered) { try { await onSaveProfile({ [target]: place }); setMapTarget('origin') } catch (error) { onError(error) }; return }
    setMapSelection({ place, target, id: `${target}:${place.id}:${Date.now()}` })
    setMapTarget(target === 'origin' ? 'destination' : 'origin')
  }
  return <main className="app-shell map-first-shell"><header className="map-header"><span className="brand-mark">N</span><strong>NO LATE</strong><TransitNavigation active="route" onNavigate={onNavigate} /></header><KakaoMap selectionTarget={mapTarget} onSelectPlace={chooseMapPlace} /><aside className="map-side-panel"><header className="map-search-heading"><span className="eyebrow">대중교통 길찾기</span><h1>어디로 갈까요?</h1><p>검색하거나 지도에서 지점을 눌러 출발지와 도착지를 정하세요.</p></header><TripRequestForm onComplete={onComplete} onError={onError} profile={profile} isRegistered={isRegistered} mapSelection={mapSelection} onMapSelectionHandled={() => setMapSelection(null)} mapTarget={mapTarget} onMapTargetChange={setMapTarget} /></aside></main>
}
