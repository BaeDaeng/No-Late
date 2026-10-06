import { supabase } from '../../supabase.js'

export async function ensureAnonymousSession() {
  if (!supabase) throw new Error('저장 기능을 사용할 수 없습니다.')
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}

const sharedData = ({ tripRequest, route, prediction }) => ({
  originName: tripRequest.origin.name,
  destinationName: tripRequest.destination.name,
  appointmentAt: tripRequest.appointmentAt,
  route: { id: route.id, totalMinutes: route.totalMinutes, transferCount: route.transferCount, segments: route.segments.map(({ type, label, durationMinutes, startName, endName }) => ({ type, label, durationMinutes, startName, endName })) },
  prediction: { safeMinutes: prediction.safeMinutes, optimisticMinutes: prediction.optimisticMinutes, leaveByTime: prediction.leaveByTime, riskScore: prediction.riskScore },
})

export async function createSharedTrip(payload) {
  const session = await ensureAnonymousSession()
  const { data, error } = await supabase.from('shared_trips').insert({ owner_id: session.user.id, data: sharedData(payload), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).select('id').single()
  if (error) throw error
  return data.id
}

export async function getSharedTrip(id) {
  if (!supabase) throw new Error('공유 결과를 불러올 수 없습니다.')
  const { data, error } = await supabase.from('shared_trips').select('data, expires_at').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data || new Date(data.expires_at) <= new Date()) throw new Error('공유 링크가 만료되었거나 존재하지 않습니다.')
  return data.data
}
