import { ensureAnonymousSession, supabase } from '../../supabase.js'

const sharedData = ({ tripRequest, route, prediction }) => ({
  originName: tripRequest.origin.name,
  destinationName: tripRequest.destination.name,
  appointmentAt: tripRequest.appointmentAt,
  route: { id: route.id, totalMinutes: route.totalMinutes, transferCount: route.transferCount, segments: route.segments.map(({ type, label, durationMinutes, startName, endName }) => ({ type, label, durationMinutes, startName, endName })) },
  prediction: { safeMinutes: prediction.safeMinutes, optimisticMinutes: prediction.optimisticMinutes, leaveByTime: prediction.leaveByTime, riskScore: prediction.riskScore },
})

const savedPlaceData = ({ origin, destination }) => ({ origin, destination })

export async function savePlacePair({ origin, destination }) {
  const session = await ensureAnonymousSession()
  const { error } = await supabase.from('saved_trips').insert({ user_id: session.user.id, data: savedPlaceData({ origin, destination }) })
  if (error) throw error
}

export async function getSavedPlacePairs() {
  const session = await ensureAnonymousSession()
  const { data, error } = await supabase.from('saved_trips').select('id, data, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return (data || []).filter((trip) => trip.data?.origin?.latitude && trip.data?.destination?.latitude)
}

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
