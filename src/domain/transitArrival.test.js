import { describe, expect, it } from 'vitest'
import { fallbackTransitArrival, toSubwayArrivals } from './transitArrival.js'

describe('transit arrival adapter', () => {
  it('converts seconds into rounded-up minutes and sorts arrivals', () => expect(toSubwayArrivals({ realtimeArrivalList: [{ subwayId: '1002', statnNm: '강남', barvlDt: '121' }, { subwayId: '1002', statnNm: '강남', barvlDt: '30' }] }, '강남').map((item) => item.arrivalInMinutes)).toEqual([1, 3]))
  it('marks fallback arrivals clearly', () => expect(fallbackTransitArrival('강남', 6).isFallback).toBe(true))
})
