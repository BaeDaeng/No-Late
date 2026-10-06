import { describe, expect, it } from 'vitest'
import { toKakaoRoutePlan, toPlace } from './adapters.js'
import { mockKakaoPlaceResponse } from './fixtures.js'

describe('API adapters', () => {
  it('normalizes a Kakao place with coordinates', () => { expect(toPlace(mockKakaoPlaceResponse.documents[0])).toMatchObject({ name: '강남역', latitude: 37.497941, longitude: 127.027621 }) })
  it('normalizes a Kakao route', () => { const plan = toKakaoRoutePlan({ properties: { totalTime: 720, transfers: 1 }, steps: [{ properties: { type: 'SUBWAY', time: 600, vehicles: [{ name: '2호선' }], stops: [{ name: '강남역' }, { name: '시청역' }] }, path: { points: [[127.02, 37.49], [126.97, 37.56]] } }] }); expect(plan).toMatchObject({ totalMinutes: 12, transferCount: 1 }); expect(plan.segments[0]).toMatchObject({ type: 'subway', label: '2호선', startName: '강남역', endName: '시청역' }) })
})
