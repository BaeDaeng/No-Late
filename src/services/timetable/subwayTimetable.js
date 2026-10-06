// 시간표 데이터가 제공되면 이 모듈에만 어댑터를 추가한다. 실시간 API로 첫차를 추정하지 않는다.
export function findNextTimetableDeparture(records = [], { stationName, lineName, direction, after = new Date() }) {
  return records
    .filter((record) => record.stationName === stationName && (!lineName || record.lineName === lineName) && (!direction || record.direction === direction))
    .map((record) => ({ ...record, departureAt: new Date(record.departureAt) }))
    .filter((record) => !Number.isNaN(record.departureAt.getTime()) && record.departureAt >= after)
    .sort((a, b) => a.departureAt - b.departureAt)[0] || null
}

export const timetableDataStatus = Object.freeze({ available: false, message: '시간표 데이터가 연결되면 첫차·막차 정보를 이 모듈에서 제공합니다.' })
