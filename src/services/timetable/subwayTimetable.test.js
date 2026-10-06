import { describe, expect, it } from 'vitest'
import { findNextTimetableDeparture, timetableDataStatus } from './subwayTimetable.js'

describe('subway timetable adapter', () => {
  it('selects the next matching scheduled departure', () => {
    const next = findNextTimetableDeparture([
      { stationName: '강남역', lineName: '2호선', direction: '외선', departureAt: '2026-10-07T08:00:00+09:00' },
      { stationName: '강남역', lineName: '2호선', direction: '외선', departureAt: '2026-10-07T08:06:00+09:00' },
    ], { stationName: '강남역', lineName: '2호선', direction: '외선', after: new Date('2026-10-07T08:01:00+09:00') })
    expect(next.departureAt.toISOString()).toBe('2026-10-06T23:06:00.000Z')
  })

  it('does not imply timetable availability before data is connected', () => {
    expect(timetableDataStatus.available).toBe(false)
  })
})
