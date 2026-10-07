export function getArrivalLikelihood(riskScore) {
  if (riskScore >= 70) return { label: '시간 내 도착 확률: 위험함', shortLabel: '위험함', tone: 'high' }
  if (riskScore >= 40) return { label: '시간 내 도착 확률: 아슬아슬함', shortLabel: '아슬아슬함', tone: 'medium' }
  if (riskScore >= 20) return { label: '시간 내 도착 확률: 높음', shortLabel: '높음', tone: 'low' }
  return { label: '시간 내 도착 확률: 매우 높음', shortLabel: '매우 높음', tone: 'low' }
}
