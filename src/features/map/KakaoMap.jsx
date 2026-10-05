import { useEffect, useRef, useState } from 'react'
import { publicApiKeys } from '../../config/publicApiKeys.js'

const sdkUrl = (key) => `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`
const mapKey = publicApiKeys.kakaoJavaScriptKey
const defaultCenter = { latitude: 37.5665, longitude: 126.978 }

function loadKakaoMaps(key) {
  if (window.kakao?.maps) return Promise.resolve(window.kakao)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao-map-sdk]')
    if (existing) { existing.addEventListener('load', () => resolve(window.kakao), { once: true }); existing.addEventListener('error', () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')), { once: true }); return }
    const script = document.createElement('script')
    script.src = sdkUrl(key)
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.onload = () => resolve(window.kakao)
    script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
    document.head.append(script)
  })
}

function routePoints(route, origin, destination) {
  const points = [origin, ...(route?.segments || []).flatMap((segment) => segment.pathPoints?.length ? segment.pathPoints : [segment.startCoordinates, segment.endCoordinates]), destination].filter(Boolean)
  return points.filter((point, index) => index === 0 || point.latitude !== points[index - 1].latitude || point.longitude !== points[index - 1].longitude)
}

export function KakaoMap({ route, origin, destination, routeMode = false }) {
  const mapElement = useRef(null)
  const overlays = useRef([])
  const [mapInstance, setMapInstance] = useState(null)
  const [status, setStatus] = useState(mapKey ? '지도를 준비하는 중입니다…' : '카카오 JavaScript 키를 추가하면 이곳에 지도가 표시됩니다.')
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    if (!mapKey) return undefined
    let cancelled = false
    loadKakaoMaps(mapKey).then((kakao) => {
      kakao.maps.load(() => {
        if (cancelled || !mapElement.current) return
        const map = new kakao.maps.Map(mapElement.current, { center: new kakao.maps.LatLng(defaultCenter.latitude, defaultCenter.longitude), level: 5 })
        kakao.maps.event.addListener(map, 'click', (event) => setSelectedLocation({ latitude: event.latLng.getLat().toFixed(5), longitude: event.latLng.getLng().toFixed(5) }))
        setMapInstance(map)
        setStatus(routeMode ? '선택한 경로를 지도에 표시합니다.' : '지도를 움직이거나 장소를 눌러 위치를 확인해 보세요.')
      })
    }).catch((error) => { if (!cancelled) setStatus(error.message) })
    return () => { cancelled = true }
  }, [routeMode])

  useEffect(() => {
    if (!mapInstance || !origin || !destination || !window.kakao?.maps) return
    overlays.current.forEach((overlay) => overlay.setMap(null))
    const kakao = window.kakao
    const positions = routePoints(route, origin, destination).map((point) => new kakao.maps.LatLng(point.latitude, point.longitude))
    const bounds = new kakao.maps.LatLngBounds()
    positions.forEach((position) => bounds.extend(position))
    const path = new kakao.maps.Polyline({ path: positions, strokeWeight: 6, strokeColor: '#2563eb', strokeOpacity: 0.9, strokeStyle: 'solid' })
    path.setMap(mapInstance)
    const markers = [new kakao.maps.Marker({ position: positions[0], map: mapInstance, title: `출발 · ${origin.name}` }), new kakao.maps.Marker({ position: positions.at(-1), map: mapInstance, title: `도착 · ${destination.name}` })]
    overlays.current = [path, ...markers]
    mapInstance.setBounds(bounds, 48, 48, 48, 48)
  }, [mapInstance, route, origin, destination])

  const statusText = routeMode ? (route ? `${route.totalMinutes}분 · ${route.transferCount}회 환승 경로` : status) : (selectedLocation ? `선택한 위치 · ${selectedLocation.latitude}, ${selectedLocation.longitude}` : status)
  return <section className={`map-card${routeMode ? ' route-map-card' : ''}`} aria-label="카카오 지도"><div className="map-canvas" ref={mapElement} /><div className="map-status"><strong>{routeMode ? '선택한 경로' : 'NO LATE 지도'}</strong><span>{statusText}</span></div></section>
}
