import { useEffect, useRef, useState } from 'react'
import { publicApiKeys } from '../../config/publicApiKeys.js'

const sdkUrl = (key) => `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`
const mapKey = publicApiKeys.kakaoJavaScriptKey

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

export function KakaoMap() {
  const mapElement = useRef(null)
  const [status, setStatus] = useState(mapKey ? '지도를 준비하는 중입니다…' : '카카오 JavaScript 키를 추가하면 이곳에 지도가 표시됩니다.')
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    if (!mapKey) return undefined
    let map
    let marker
    let cancelled = false
    loadKakaoMaps(mapKey).then((kakao) => {
      kakao.maps.load(() => {
        if (cancelled || !mapElement.current) return
        const center = new kakao.maps.LatLng(37.5665, 126.978)
        map = new kakao.maps.Map(mapElement.current, { center, level: 5 })
        kakao.maps.event.addListener(map, 'click', (event) => {
          const point = event.latLng
          if (!marker) marker = new kakao.maps.Marker({ position: point, map })
          else marker.setPosition(point)
          setSelectedLocation({ latitude: point.getLat().toFixed(5), longitude: point.getLng().toFixed(5) })
        })
        setStatus('지도를 움직이거나 장소를 눌러 위치를 확인해 보세요.')
      })
    }).catch((error) => { if (!cancelled) setStatus(error.message) })
    return () => { cancelled = true; if (map) map = null }
  }, [])

  return <section className="map-card" aria-label="카카오 지도"><div className="map-canvas" ref={mapElement} /><div className="map-status"><strong>NO LATE 지도</strong><span>{selectedLocation ? `선택한 위치 · ${selectedLocation.latitude}, ${selectedLocation.longitude}` : status}</span></div></section>
}
