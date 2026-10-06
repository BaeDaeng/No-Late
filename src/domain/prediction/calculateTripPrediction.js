import { PREDICTION_WEIGHTS as weights } from '../../config/predictionWeights.js'

const ceil = (value) => Math.max(0, Math.ceil(value))
const plusMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000).toISOString()

export function calculateTripPrediction({ route, tripRequest, weather = null, arrival = null, now = new Date() }) {
  const walkSegments = route.segments?.filter((segment) => segment.type === 'walk') || []
  const weatherMultiplier = weather?.precipitationType === 'rain' ? weights.rainWalkMultiplier : weather?.precipitationType === 'snow' ? weights.snowWalkMultiplier : weather?.precipitationType === 'mixed' ? weights.mixedWalkMultiplier : 0
  const weatherMinutes = ceil((route.totalWalkMinutes || 0) * weatherMultiplier) + (Number(weather?.precipitationMm) >= weights.heavyPrecipitationMm ? weights.heavyPrecipitationExtraMinutes : 0)
  const liveWait = Number.isFinite(arrival?.arrivalInMinutes) ? Math.max(0, arrival.arrivalInMinutes) : null
  const extraWaitMinutes = liveWait === null ? 0 : Math.max(0, liveWait - weights.expectedTransitWaitMinutes)
  const signalMinutes = walkSegments.length * weights.signalMinutesPerWalkSegment
  const usesFallbackData = Boolean(weather?.isFallback || arrival?.isFallback || !weather || !arrival)
  const uncertaintyMinutes = (route.transferCount || 0) * weights.transferUncertaintyMinutes + walkSegments.length * weights.walkSegmentUncertaintyMinutes + (usesFallbackData ? weights.missingRealtimeMinutes : 0)
  const baseMinutes = ceil(route.totalMinutes || 0)
  const optimisticMinutes = baseMinutes + weatherMinutes + extraWaitMinutes + signalMinutes
  const safeMinutes = Math.max(optimisticMinutes, optimisticMinutes + uncertaintyMinutes)
  const appointment = new Date(tripRequest.appointmentAt)
  const leaveBy = new Date(appointment.getTime() - safeMinutes * 60_000)
  const minutesUntilLeave = Math.floor((leaveBy.getTime() - now.getTime()) / 60_000)
  const riskScore = minutesUntilLeave < 0 ? 95 : minutesUntilLeave <= 5 ? 78 : minutesUntilLeave <= 15 ? 48 : 18
  const confidence = usesFallbackData ? 'low' : (route.transferCount || 0) >= 2 ? 'medium' : 'high'
  const adverseWeather = ['rain', 'snow', 'mixed'].includes(weather?.precipitationType)
  const runningSuggestionMinutes = tripRequest.urgency === 'hurry' && !adverseWeather && confidence !== 'low' ? Math.floor((route.totalWalkMinutes || 0) * weights.hurryWalkingReduction) : 0
  const adjustmentBreakdown = [
    { label: '기본 경로', minutes: baseMinutes, reason: '대중교통 경로와 건물 퇴실시간' },
    ...(weatherMinutes ? [{ label: weather?.precipitationType === 'snow' ? '눈길 보정' : '강수 보정', minutes: weatherMinutes, reason: '도보 구간을 보수적으로 계산' }] : []),
    ...(extraWaitMinutes ? [{ label: '첫 차량 대기', minutes: extraWaitMinutes, reason: '실시간 도착정보 반영' }] : []),
    ...(signalMinutes ? [{ label: '신호·횡단 대기', minutes: signalMinutes, reason: '도보 구간 수 기준' }] : []),
    ...(uncertaintyMinutes ? [{ label: '안전 여유', minutes: uncertaintyMinutes, reason: usesFallbackData ? '일부 실시간 정보 미수신' : '환승·도보 불확실성' }] : []),
  ]
  return { baseMinutes, optimisticMinutes, safeMinutes, leaveByTime: leaveBy.toISOString(), optimisticArrivalTime: plusMinutes(now, optimisticMinutes), safeArrivalTime: plusMinutes(now, safeMinutes), riskScore, adjustmentBreakdown, usedFallbackData: usesFallbackData, confidence, runningSuggestionMinutes, minutesUntilLeave }
}
