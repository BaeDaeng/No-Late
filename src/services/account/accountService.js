import { ensureAnonymousSession, supabase } from '../../supabase.js'

const emptyProfile = Object.freeze({ heightCm: null, home: null, work: null })

export function isRegisteredUser(user) {
  return Boolean(user?.email)
}

export async function registerWithEmail({ email, password, heightCm }) {
  const session = await ensureAnonymousSession()
  const { data, error } = await supabase.auth.updateUser({ email, password })
  if (error) throw error
  await saveProfile(data.user || session.user, { heightCm: Number(heightCm) })
  return data.user || session.user
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signOutToGuest() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(user) {
  if (!supabase || !isRegisteredUser(user)) return emptyProfile
  const { data, error } = await supabase.from('user_settings').select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return { ...emptyProfile, ...(data?.data || {}) }
}

export async function saveProfile(user, patch) {
  if (!supabase || !isRegisteredUser(user)) throw new Error('로그인한 회원만 설정을 저장할 수 있습니다.')
  const current = await getProfile(user)
  const data = { ...current, ...patch }
  const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, data, updated_at: new Date().toISOString() })
  if (error) throw error
  return data
}
