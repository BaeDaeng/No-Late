import { describe, expect, it } from 'vitest'
import { calculateTripPrediction } from './calculateTripPrediction.js'

const route = { totalMinutes: 30, totalWalkMinutes: 8, transferCount: 1, segments: [{ type: 'walk' }, { type: 'subway' }, { type: 'walk' }] }
const tripRequest = { appointmentAt: '2026-10-07T01:00:00.000Z', urgency: 'normal' }
const now = new Date('2026-10-07T00:00:00.000Z')

describe('trip prediction', () => {
  it('keeps a safe estimate at least as long as the optimistic estimate', () => {
    const result = calculateTripPrediction({ route, tripRequest, weather: { precipitationType: 'rain', precipitationMm: 2 }, arrival: { arrivalInMinutes: 8 }, now })
    expect(result.safeMinutes).toBeGreaterThanOrEqual(result.optimisticMinutes)
    expect(result.leaveByTime).toBe('2026-10-07T00:17:00.000Z')
  })
  it('adds a conservative buffer when realtime data is absent', () => {
    const result = calculateTripPrediction({ route, tripRequest, now })
    expect(result.usedFallbackData).toBe(true)
    expect(result.confidence).toBe('low')
  })
  it('raises risk after the leave-by time has passed', () => {
    const result = calculateTripPrediction({ route, tripRequest, now: new Date('2026-10-07T00:55:00.000Z') })
    expect(result.riskScore).toBe(95)
  })
})
