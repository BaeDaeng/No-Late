export function getCurrentCoordinates(geolocation = navigator.geolocation) {
  return new Promise((resolve, reject) => {
    if (!geolocation) { reject(new Error('이 브라우저는 현재 위치를 지원하지 않습니다.')); return }
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(error.code === 1 ? '현재 위치 권한이 거부되었습니다.' : '현재 위치를 가져오지 못했습니다.')),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}
