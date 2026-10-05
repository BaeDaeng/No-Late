import { describe, expect, it } from 'vitest'
import { toPlace, toRoutePlan } from './adapters.js'
import { mockKakaoPlaceResponse, mockOdsayResponse } from './fixtures.js'

describe('API adapters', () => {
  it('normalizes a Kakao place with coordinates', () => { expect(toPlace(mockKakaoPlaceResponse.documents[0])).toMatchObject({ name: '강남역', latitude: 37.497941, longitude: 127.027621 }) })
  it('normalizes a mixed ODsay route', () => { const plan = toRoutePlan(mockOdsayResponse.result.path[0]); expect(plan.segments.map((segment) => segment.type)).toEqual(['walk', 'subway']); expect(plan.segments[0].startCoordinates).toEqual({ longitude: 127.0276, latitude: 37.4979 }); expect(plan.totalMinutes).toBe(32) })
  it('handles missing optional ODsay fields', () => { const plan = toRoutePlan({ info: { totalTime: 12 }, subPath: [{ trafficType: 2 }] }); expect(plan.segments[0]).toMatchObject({ type: 'bus', durationMinutes: 0, label: '대중교통' }) })
})
