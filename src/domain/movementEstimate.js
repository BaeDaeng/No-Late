import { estimateExitMinutes } from './exitEstimate.js'

const urgencyMultiplier = { relaxed: 0.8, normal: 1, hurry: 1.35 }

export function estimateWalkingSpeedMetersPerMinute(heightCm, urgency = 'normal') {
  const height = Number(heightCm)
  const baseSpeed = 75 + (height - 165) * 0.22
  return Math.round(Math.min(145, Math.max(50, baseSpeed * (urgencyMultiplier[urgency] || 1))))
}

export function personalizeRoute(route, tripRequest) {
  const walkingSpeedMetersPerMinute = estimateWalkingSpeedMetersPerMinute(tripRequest.heightCm, tripRequest.urgency)
  const totalWalkMinutes = Math.ceil(route.totalWalkMeters / walkingSpeedMetersPerMinute)
  const adjustedTransitMinutes = Math.max(0, route.totalMinutes - route.totalWalkMinutes)
  const buildingExitMinutes = estimateExitMinutes(tripRequest.currentFloor) || 0
  return { ...route, totalWalkMinutes, walkingSpeedMetersPerMinute, buildingExitMinutes, totalMinutes: adjustedTransitMinutes + totalWalkMinutes + buildingExitMinutes }
}
