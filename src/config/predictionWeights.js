// MVP 경험칙이며 사용자 테스트로 조정 필요: 실제 지각 확률이나 운행 보장은 아니다.
export const PREDICTION_WEIGHTS = Object.freeze({
  expectedTransitWaitMinutes: 3,
  signalMinutesPerWalkSegment: 1,
  transferUncertaintyMinutes: 2,
  walkSegmentUncertaintyMinutes: 1,
  missingRealtimeMinutes: 3,
  rainWalkMultiplier: 0.25,
  snowWalkMultiplier: 0.35,
  mixedWalkMultiplier: 0.4,
  heavyPrecipitationMm: 10,
  heavyPrecipitationExtraMinutes: 2,
  hurryWalkingReduction: 0.15,
})
