const subwayLineLabels = {
  1001: '1호선', 1002: '2호선', 1003: '3호선', 1004: '4호선', 1005: '5호선', 1006: '6호선', 1007: '7호선', 1008: '8호선', 1009: '9호선',
  1032: 'GTX-A', 1061: '중앙선', 1063: '경의·중앙선', 1065: '공항철도', 1067: '경춘선', 1075: '수인분당선', 1077: '신분당선', 1081: '경강선', 1092: '우이신설선', 1093: '서해선', 1094: '신림선',
}
const subwayLineColors = {
  1001: '#1c4f98', 1002: '#23a35c', 1003: '#e77d23', 1004: '#2e9cc9', 1005: '#8936a9', 1006: '#8a4f2a', 1007: '#6a9b32', 1008: '#e35b8c', 1009: '#b89922',
  1032: '#9f6181', 1061: '#80c342', 1063: '#75c7ba', 1065: '#2498d8', 1067: '#16806f', 1075: '#f5bb2c', 1077: '#cf2766', 1081: '#0054a6', 1092: '#b7d431', 1093: '#7a4e99', 1094: '#678bbd',
}

export function subwayLineLabel(routeId) {
  return subwayLineLabels[String(routeId)] || '전철'
}

export function subwayLineColor(routeId) {
  return subwayLineColors[String(routeId)] || '#6b7280'
}

export function toSubwayArrivals(data, stationName) {
  return (data.realtimeArrivalList || []).map((item) => {
    const seconds = Number(item.barvlDt)
    return { routeId: String(item.subwayId || ''), stopName: item.statnNm || stationName, arrivalInMinutes: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : null, fetchedAt: new Date().toISOString(), source: 'seoul-subway', isFallback: false, message: item.arvlMsg2 || item.arvlMsg3 || '', direction: item.updnLine || '' }
  }).sort((a, b) => (a.arrivalInMinutes ?? Infinity) - (b.arrivalInMinutes ?? Infinity))
}

export function selectSubwayArrival(arrivals, lineLabel) {
  const normalized = String(lineLabel || '').replace(/\s/g, '').replace('경의중앙선', '경의·중앙선')
  return arrivals.find((arrival) => subwayLineLabel(arrival.routeId).replace(/\s/g, '') === normalized) || null
}

export function fallbackTransitArrival(stopName, minutes) { return { routeId: '', stopName, arrivalInMinutes: minutes, fetchedAt: new Date().toISOString(), source: 'fallback', isFallback: true, message: '실시간 도착 정보를 받지 못해 기본 대기시간으로 계산합니다.', direction: '' } }

export function toBusVehicleStatus(data, stopName) {
  const vehicles = Array.isArray(data.msgBody?.itemList) ? data.msgBody.itemList : data.msgBody?.itemList ? [data.msgBody.itemList] : []
  return { routeId: '', stopName, arrivalInMinutes: null, fetchedAt: new Date().toISOString(), source: 'seoul-bus', isFallback: false, message: vehicles.length ? `해당 노선 차량 ${vehicles.length}대 운행 정보 확인` : '운행 차량 정보를 받지 못했습니다.', direction: '' }
}
