import { describe, expect, it } from 'vitest'
import { estimateWalkingSpeedMetersPerMinute, personalizeRoute } from './movementEstimate.js'

describe('movement estimate', () => {
  it('uses height and urgency to estimate speed', () => expect(estimateWalkingSpeedMetersPerMinute(180, 'hurry')).toBeGreaterThan(estimateWalkingSpeedMetersPerMinute(160, 'relaxed')))
  it('adds the estimated building exit time to a route', () => {
    const result = personalizeRoute({ totalMinutes: 20, totalWalkMinutes: 4, totalWalkMeters: 300 }, { heightCm: 170, urgency: 'normal', currentFloor: 3 })
    expect(result.buildingExitMinutes).toBeGreaterThan(0)
    expect(result.totalMinutes).toBeGreaterThan(20)
  })
})
