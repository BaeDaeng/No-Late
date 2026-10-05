/**
 * 엘리베이터·출입구 정보가 없는 MVP용 보수적 추정치다.
 * 실제 건물 구조를 알 수 없으므로, 층당 이동과 현관 통과 시간을 포함한다.
 */
export function estimateExitMinutes(currentFloor) {
  const floor = Number(currentFloor)
  if (!Number.isFinite(floor)) return null
  const floorsToGround = Math.abs(floor)
  return Math.max(1, Math.ceil(1 + floorsToGround * (floor < 0 ? 0.7 : 0.55)))
}
