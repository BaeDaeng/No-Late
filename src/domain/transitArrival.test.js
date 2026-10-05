import { describe, expect, it } from 'vitest'
import { fallbackTransitArrival, toBusVehicleStatus, toSubwayArrivals } from './transitArrival.js'

describe('transit arrival adapter', () => {
  it('converts seconds into rounded-up minutes and sorts arrivals', () => expect(toSubwayArrivals({ realtimeArrivalList: [{ subwayId: '1002', statnNm: '강남', barvlDt: '121' }, { subwayId: '1002', statnNm: '강남', barvlDt: '30' }] }, '강남').map((item) => item.arrivalInMinutes)).toEqual([1, 3]))
  it('marks fallback arrivals clearly', () => expect(fallbackTransitArrival('강남', 6).isFallback).toBe(true))
  it('describes a bus position response without inventing an arrival time', () => expect(toBusVehicleStatus({ msgBody: { itemList: [{ vehId: '1' }] } }, '강남').arrivalInMinutes).toBeNull())
})
