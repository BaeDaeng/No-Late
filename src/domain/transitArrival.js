export function toSubwayArrivals(data, stationName) {
  return (data.realtimeArrivalList || []).map((item) => {
    const seconds = Number(item.barvlDt)
    return { routeId: String(item.subwayId || ''), stopName: item.statnNm || stationName, arrivalInMinutes: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : null, fetchedAt: new Date().toISOString(), source: 'seoul-subway', isFallback: false, message: item.arvlMsg2 || item.arvlMsg3 || '', direction: item.updnLine || '' }
  }).sort((a, b) => (a.arrivalInMinutes ?? Infinity) - (b.arrivalInMinutes ?? Infinity))
}

export function fallbackTransitArrival(stopName, minutes) { return { routeId: '', stopName, arrivalInMinutes: minutes, fetchedAt: new Date().toISOString(), source: 'fallback', isFallback: true, message: '실시간 도착 정보를 받지 못해 기본 대기시간으로 계산합니다.', direction: '' } }

export function toBusVehicleStatus(data, stopName) {
  const vehicles = Array.isArray(data.msgBody?.itemList) ? data.msgBody.itemList : data.msgBody?.itemList ? [data.msgBody.itemList] : []
  return { routeId: '', stopName, arrivalInMinutes: null, fetchedAt: new Date().toISOString(), source: 'seoul-bus', isFallback: false, message: vehicles.length ? `해당 노선 차량 ${vehicles.length}대 운행 정보 확인` : '운행 차량 정보를 받지 못했습니다.', direction: '' }
}
