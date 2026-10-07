import { useCallback, useEffect, useRef, useState } from 'react'
import { publicApiKeys } from '../../config/publicApiKeys.js'
import { apiClient } from '../../services/api/apiClient.js'

const sdkUrl = (key) => `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`
const mapKey = publicApiKeys.kakaoJavaScriptKey
const defaultCenter = { latitude: 37.5665, longitude: 126.978 }

function loadKakaoMaps(key) {
  if (window.kakao?.maps) return Promise.resolve(window.kakao)
  return new Promise((resolve, reject) => { const existing = document.querySelector('script[data-kakao-map-sdk]'); if (existing) { existing.addEventListener('load', () => resolve(window.kakao), { once: true }); existing.addEventListener('error', () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')), { once: true }); return }; const script = document.createElement('script'); script.src = sdkUrl(key); script.async = true; script.dataset.kakaoMapSdk = 'true'; script.onload = () => resolve(window.kakao); script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')); document.head.append(script) })
}
function routePoints(route, origin, destination) { const points = [origin, ...(route?.segments || []).flatMap((segment) => segment.pathPoints?.length ? segment.pathPoints : [segment.startCoordinates, segment.endCoordinates]), destination].filter(Boolean); return points.filter((point, index) => index === 0 || point.latitude !== points[index - 1].latitude || point.longitude !== points[index - 1].longitude) }

export function KakaoMap({ route, origin, destination, routeMode = false, selectionTarget = 'origin', onSelectPlace }) {
  const mapElement = useRef(null)
  const overlays = useRef([])
  const clickMarker = useRef(null)
  const nearbyMarkers = useRef([])
  const [mapInstance, setMapInstance] = useState(null)
  const [status, setStatus] = useState(mapKey ? '지도를 준비하는 중입니다…' : '카카오 JavaScript 키를 추가하면 이곳에 지도가 표시됩니다.')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [popupPosition, setPopupPosition] = useState(null)
  const [zoom, setZoom] = useState(5)

  const updatePopupPosition = useCallback((place, map) => {
    if (!place || !map || !window.kakao?.maps) return
    const point = map.getProjection().pointFromCoords(new window.kakao.maps.LatLng(place.latitude, place.longitude))
    const popupWidth = Math.min(300, Math.max(220, window.innerWidth - 24))
    const horizontalInset = (popupWidth / 2) + 12
    const left = Math.max(horizontalInset, Math.min(point.x, window.innerWidth - horizontalInset))
    setPopupPosition({ left: `${left}px`, top: `${point.y}px`, placement: point.y < 168 ? 'below' : 'above' })
  }, [])

  useEffect(() => {
    if (!mapKey) return undefined
    let cancelled = false
    loadKakaoMaps(mapKey).then((kakao) => kakao.maps.load(() => {
      if (cancelled || !mapElement.current) return
      const map = new kakao.maps.Map(mapElement.current, { center: new kakao.maps.LatLng(defaultCenter.latitude, defaultCenter.longitude), level: 5 })
      kakao.maps.event.addListener(map, 'zoom_changed', () => setZoom(map.getLevel()))
      kakao.maps.event.addListener(map, 'click', async (event) => {
        const coordinates = { latitude: event.latLng.getLat(), longitude: event.latLng.getLng() }
        try { const [place, nearby] = await Promise.all([apiClient.reverseGeocode(coordinates), apiClient.getNearbyPlaces(coordinates)]); if (!cancelled) { setSelectedLocation(place); updatePopupPosition(place, map); if (clickMarker.current) clickMarker.current.setMap(null); clickMarker.current = new kakao.maps.Marker({ position: event.latLng, map }); nearbyMarkers.current.forEach((marker) => marker.setMap(null)); nearbyMarkers.current = nearby.map((nearbyPlace) => { const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(nearbyPlace.latitude, nearbyPlace.longitude), map, title: nearbyPlace.name }); kakao.maps.event.addListener(marker, 'click', () => { setSelectedLocation(nearbyPlace); updatePopupPosition(nearbyPlace, map) }); return marker }); setStatus(`${place.name}을(를) 선택했습니다.`) } } catch { if (!cancelled) setStatus('선택한 위치의 장소 정보를 찾지 못했습니다.') }
      })
      setMapInstance(map); setStatus(routeMode ? '선택한 경로를 지도에 표시합니다.' : '지도를 누르면 출발지·도착지·집·회사로 지정할 수 있습니다.')
    })).catch((error) => { if (!cancelled) setStatus(error.message) })
    return () => { cancelled = true }
  }, [routeMode, updatePopupPosition])

  useEffect(() => {
    if (!mapInstance || !selectedLocation || !window.kakao?.maps) return undefined
    const refreshPopupPosition = () => updatePopupPosition(selectedLocation, mapInstance)
    window.kakao.maps.event.addListener(mapInstance, 'idle', refreshPopupPosition)
    return () => window.kakao.maps.event.removeListener(mapInstance, 'idle', refreshPopupPosition)
  }, [mapInstance, selectedLocation, updatePopupPosition])

  useEffect(() => {
    if (!mapInstance || !origin || !destination || !window.kakao?.maps) return
    overlays.current.forEach((overlay) => overlay.setMap(null))
    const kakao = window.kakao
    const positions = routePoints(route, origin, destination).map((point) => new kakao.maps.LatLng(point.latitude, point.longitude))
    const bounds = new kakao.maps.LatLngBounds(); positions.forEach((position) => bounds.extend(position))
    const path = new kakao.maps.Polyline({ path: positions, strokeWeight: 6, strokeColor: '#15c', strokeOpacity: .88, strokeStyle: 'solid' }); path.setMap(mapInstance)
    const markers = [new kakao.maps.Marker({ position: positions[0], map: mapInstance, title: `출발 · ${origin.name}` }), new kakao.maps.Marker({ position: positions.at(-1), map: mapInstance, title: `도착 · ${destination.name}` })]
    overlays.current = [path, ...markers]; mapInstance.setBounds(bounds, 56, 56, 56, 56)
  }, [mapInstance, route, origin, destination])

  const moveZoom = (amount) => { if (mapInstance) mapInstance.setLevel(Math.max(1, Math.min(14, mapInstance.getLevel() + amount))) }
  const assignSelected = (target = selectionTarget) => { if (selectedLocation && onSelectPlace) onSelectPlace(selectedLocation, target) }
  const targetName = selectionTarget === 'origin' ? '출발지' : selectionTarget === 'destination' ? '도착지' : selectionTarget === 'home' ? '집' : '회사'
  const statusText = routeMode ? (route ? `${route.totalMinutes}분 · ${route.transferCount}회 환승 경로` : status) : status
  return <section className={`map-card${routeMode ? ' route-map-card' : ''}`} aria-label="카카오 지도"><div className="map-canvas"><div className="map-sdk-host" ref={mapElement} /></div><div className="map-controls" aria-label="지도 확대 축소"><button type="button" onClick={() => moveZoom(-1)}>＋</button><button type="button" onClick={() => moveZoom(1)}>－</button><span>{zoom}</span></div>{!routeMode && selectedLocation && <div className={`map-click-card${popupPosition?.placement === 'below' ? ' below' : ''}`} style={popupPosition || undefined}><div className="place-title"><strong>{selectedLocation.name}</strong>{selectedLocation.category && <span>{selectedLocation.category}</span>}</div><p>{selectedLocation.address || '주소 정보가 없습니다.'}</p>{selectedLocation.phone && <span className="place-phone">{selectedLocation.phone}</span>}<div className="place-actions"><button type="button" onClick={() => assignSelected('origin')}>출발</button><button type="button" onClick={() => assignSelected('destination')}>도착</button></div></div>}<div className="map-status"><strong>{routeMode ? '선택한 경로' : `지도에서 ${targetName} 선택`}</strong><span>{statusText}</span></div></section>
}
