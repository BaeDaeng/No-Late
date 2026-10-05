export function toSubwayArrivals(data, stationName) {
  return (data.realtimeArrivalList || []).map((item) => ({ routeId: String(item.subwayId || ''), stopName: item.statnNm || stationName, arrivalInMinutes: Number.isFinite(Number(item.barvlDt)) ? Math.ceil(Number(item.barvlDt) / 60) : null, fetchedAt: new Date().toISOString(), source: 'seoul-subway', isFallback: false, message: item.arvlMsg2 || item.arvlMsg3 || '', direction: item.updnLine || '' })).sort((a, b) => (a.arrivalInMinutes ?? Infinity) - (b.arrivalInMinutes ?? Infinity))
}

export function fallbackTransitArrival(stopName, minutes) { return { routeId: '', stopName, arrivalInMinutes: minutes, fetchedAt: new Date().toISOString(), source: 'fallback', isFallback: true, message: '실시간 도착 정보를 받지 못해 기본 대기시간으로 계산합니다.', direction: '' } }
