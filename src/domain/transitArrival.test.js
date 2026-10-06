import { describe, expect, it } from 'vitest'
import { fallbackTransitArrival, selectSubwayArrival, toBusVehicleStatus, toSubwayArrivals } from './transitArrival.js'

describe('transit arrival adapter', () => {
  it('converts seconds into rounded-up minutes and sorts arrivals', () => expect(toSubwayArrivals({ realtimeArrivalList: [{ subwayId: '1002', statnNm: '강남', barvlDt: '121' }, { subwayId: '1002', statnNm: '강남', barvlDt: '30' }] }, '강남').map((item) => item.arrivalInMinutes)).toEqual([1, 3]))
  it('does not present an unknown zero-second ETA as immediate arrival', () => expect(toSubwayArrivals({ realtimeArrivalList: [{ subwayId: '1077', statnNm: '강남', barvlDt: '0', arvlMsg2: '[5]번째 전역' }] }, '강남')[0]).toMatchObject({ arrivalInMinutes: null, message: '[5]번째 전역' }))
  it('uses a subway arrival only when it matches the route line', () => { const arrivals = [{ routeId: '1001', arrivalInMinutes: 2 }, { routeId: '1002', arrivalInMinutes: 5 }]; expect(selectSubwayArrival(arrivals, '2호선')).toEqual({ routeId: '1002', arrivalInMinutes: 5 }); expect(selectSubwayArrival(arrivals, '경의중앙선')).toBeNull() })
  it('marks fallback arrivals clearly', () => expect(fallbackTransitArrival('강남', 6).isFallback).toBe(true))
  it('describes a bus position response without inventing an arrival time', () => expect(toBusVehicleStatus({ msgBody: { itemList: [{ vehId: '1' }] } }, '강남').arrivalInMinutes).toBeNull())
})
