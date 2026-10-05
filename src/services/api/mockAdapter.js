import { mockRoutePlan } from './fixtures.js'
export const isMockMode = import.meta.env.VITE_USE_MOCK_API === 'true'
export function createMockTripPrediction(request) { const safeMinutes = 48; const leaveBy = new Date(new Date(request.appointmentAt).getTime() - safeMinutes * 60_000); return { baseMinutes: 39, optimisticMinutes: 42, safeMinutes, leaveByTime: leaveBy.toISOString(), riskScore: 28, routePlan: mockRoutePlan, adjustmentBreakdown: [{ label: '신호 대기', minutes: 3, reason: 'MVP 기본 보정' }] } }
