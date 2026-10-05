/** @typedef {{ id:string, name:string, address:string, latitude:number, longitude:number }} Place WGS84 도 단위 좌표. */
/** @typedef {{ origin:Place, destination:Place, appointmentAt:string, currentFloor:number, heightCm:number, urgency:'relaxed'|'normal'|'hurry' }} TripRequest 오늘 약속 ISO 시간과 층수. */
/** @typedef {{ id:string, type:'walk'|'bus'|'subway', durationMinutes:number, distanceMeters:number|null, label:string, startName:string, endName:string }} RouteSegment 시간은 분, 거리는 미터. */
/** @typedef {{ id:string, totalMinutes:number, totalWalkMinutes:number, transferCount:number, segments:RouteSegment[] }} RoutePlan 시간은 분. */
/** @typedef {{ precipitationType:'none'|'rain'|'snow'|'mixed', precipitationMm:number|null, forecastAt:string, fetchedAt:string, source:string, isFallback:boolean }} WeatherCondition 강수량은 mm/h. */
/** @typedef {{ routeId:string, stopName:string, arrivalInMinutes:number|null, fetchedAt:string, source:string, isFallback:boolean, message:string, direction:string }} TransitArrival 대기시간은 분. */
/** @typedef {{ label:string, minutes:number, reason:string }} TravelAdjustment 분 단위 보정. */
/** @typedef {{ baseMinutes:number, optimisticMinutes:number, safeMinutes:number, leaveByTime:string, riskScore:number, adjustmentBreakdown:TravelAdjustment[] }} TripPrediction 시간은 분. */
export {}
