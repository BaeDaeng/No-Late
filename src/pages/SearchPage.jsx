import { TripRequestForm } from '../features/search/TripRequestForm.jsx'
import { KakaoMap } from '../features/map/KakaoMap.jsx'
export function SearchPage({ onComplete, onError }) { return <main className="app-shell map-first-shell"><header className="map-header"><span className="eyebrow">NO LATE · 서울권 MVP</span><strong>늦지 않게 출발하기</strong></header><KakaoMap /><div className="route-panel"><header className="hero-copy"><h1>어디로 갈까요?</h1><p className="muted">지도에서 장소를 살펴본 뒤, 길찾기로 늦지 않는 출발 시간을 계산하세요.</p></header><TripRequestForm onComplete={onComplete} onError={onError} /></div></main> }
