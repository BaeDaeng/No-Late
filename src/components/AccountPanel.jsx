import { useState } from 'react'
import { registerWithEmail, signInWithEmail, signOutToGuest } from '../services/account/accountService.js'
import { getSavedTrips } from '../services/trips/tripStore.js'

export function AccountPanel({ user, profile, onUserChange, onProfileChange }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('signin')
  const [status, setStatus] = useState('')
  const [values, setValues] = useState({ email: '', password: '', heightCm: profile?.heightCm || '' })
  const [savedTrips, setSavedTrips] = useState(null)
  const registered = Boolean(user?.email)
  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    try {
      setStatus('처리 중…')
      const nextUser = mode === 'signup' ? await registerWithEmail(values) : await signInWithEmail(values)
      onUserChange(nextUser)
      setStatus(mode === 'signup' ? '회원가입을 완료했습니다. 인증 메일을 받았다면 확인해 주세요.' : '로그인했습니다.')
      if (mode === 'signup') onProfileChange({ heightCm: Number(values.heightCm), home: null, work: null })
    } catch (error) { setStatus(error.message || '요청을 처리하지 못했습니다.') }
  }
  const logout = async () => { try { await signOutToGuest(); onUserChange(null); onProfileChange({ heightCm: null, home: null, work: null }); setOpen(false) } catch { setStatus('로그아웃하지 못했습니다.') } }
  const loadSavedTrips = async () => { try { setStatus('저장한 경로를 불러오는 중…'); const trips = await getSavedTrips(); setSavedTrips(trips); setStatus(trips.length ? '' : '아직 저장한 경로가 없습니다.') } catch { setStatus('저장한 경로를 불러오지 못했습니다.') } }
  return <aside className="account-area"><button className="profile-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{registered ? '●' : '◯'} <span>{registered ? '내 프로필' : '로그인'}</span></button>{open && <section className="account-panel">{registered ? <><strong>{user.email}</strong><p>키 {profile?.heightCm || '-'}cm · 집/회사 위치와 저장 경로를 이 계정에서 사용합니다.</p><button className="text-button" type="button" onClick={loadSavedTrips}>저장한 경로 보기</button>{savedTrips && <ul className="saved-trip-list">{savedTrips.map((trip) => <li key={trip.id}><strong>{trip.data.originName} → {trip.data.destinationName}</strong><span>안전 예상 {trip.data.prediction.safeMinutes}분</span></li>)}</ul>}<button className="text-button" type="button" onClick={logout}>로그아웃</button></> : <><div className="account-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>로그인</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>회원가입</button></div><form onSubmit={submit}><label>이메일<input name="email" type="email" value={values.email} onChange={update} required autoComplete="email" /></label><label>비밀번호<input name="password" type="password" minLength="6" value={values.password} onChange={update} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>{mode === 'signup' && <label>키 (cm)<input name="heightCm" type="number" min="100" max="250" value={values.heightCm} onChange={update} required /></label>}<button className="button" type="submit">{mode === 'signup' ? '가입하고 저장하기' : '로그인'}</button></form><p className="account-note">로그인하지 않아도 길찾기는 그대로 이용할 수 있어요.</p></>}{status && <p className="field-hint" role="status">{status}</p>}</section>}</aside>
}
