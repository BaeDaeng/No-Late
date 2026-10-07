import { ensureAnonymousSession, supabase } from '../../supabase.js'

const emptyProfile = Object.freeze({ heightCm: null, home: null, work: null })

export function toKoreanAuthError(error) {
  const message = String(error?.message || '')
  const code = String(error?.code || '')
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (/new password should be different from the old password/i.test(message)) return '새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요.'
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return '인증 메일을 확인한 뒤 로그인해 주세요.'
  if (code === 'user_already_exists' || /user already registered|already been registered/i.test(message)) return '이미 가입된 이메일입니다. 로그인해 주세요.'
  if (/password should be at least|password is too short/i.test(message)) return '비밀번호는 6자 이상으로 입력해 주세요.'
  if (/email rate limit exceeded|over_email_send_rate_limit/i.test(message)) return '인증 메일 요청이 많습니다. 잠시 후 다시 시도해 주세요.'
  if (/invalid email/i.test(message)) return '이메일 주소 형식을 확인해 주세요.'
  return '인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function isRegisteredUser(user) {
  return Boolean(user?.email)
}

export async function registerWithEmail({ email, password, heightCm }) {
  const session = await ensureAnonymousSession()
  const { data, error } = await supabase.auth.updateUser({ email, password })
  if (error) throw new Error(toKoreanAuthError(error))
  await saveProfile(data.user || session.user, { heightCm: Number(heightCm) })
  return data.user || session.user
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(toKoreanAuthError(error))
  return data.user
}

export async function signOutToGuest() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(toKoreanAuthError(error))
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
