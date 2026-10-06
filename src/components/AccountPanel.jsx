import { useState } from 'react'
import { registerWithEmail, saveProfile, signInWithEmail, signOutToGuest } from '../services/account/accountService.js'
import { getSavedPlacePairs } from '../services/trips/tripStore.js'
import { isFutureTodayTime } from '../utils/time.js'

export function AccountPanel({ user, profile, onUserChange, onProfileChange, onStartSavedRoute }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('signin')
  const [status, setStatus] = useState('')
  const [values, setValues] = useState({ email: '', password: '', heightCm: profile?.heightCm || '' })
  const [savedPlacePairs, setSavedPlacePairs] = useState(null)
  const [selectedPairId, setSelectedPairId] = useState(null)
  const [appointmentTime, setAppointmentTime] = useState('')
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
  const saveHeight = async (event) => { event.preventDefault(); const heightCm = Number(values.heightCm || profile?.heightCm); if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) { setStatus('키는 100cm부터 250cm까지 입력해 주세요.'); return }; try { setStatus('키를 저장하는 중…'); onProfileChange(await saveProfile(user, { heightCm })); setValues((current) => ({ ...current, heightCm: String(heightCm) })); setStatus('키를 저장했어요.') } catch { setStatus('키를 저장하지 못했습니다.') } }
  const loadSavedPlacePairs = async () => { try { setStatus('저장한 장소를 불러오는 중…'); const pairs = await getSavedPlacePairs(); setSavedPlacePairs(pairs); setStatus(pairs.length ? '' : '아직 저장한 출발지·도착지가 없습니다.') } catch { setStatus('저장한 장소를 불러오지 못했습니다.') } }
  const startSavedRoute = () => { const pair = savedPlacePairs?.find((item) => item.id === selectedPairId); if (!pair) return; if (!isFutureTodayTime(appointmentTime)) { setStatus('오늘 현재 시각 이후의 약속 시간을 선택해 주세요.'); return }; onStartSavedRoute({ origin: pair.data.origin, destination: pair.data.destination, appointmentTime }); setOpen(false) }
  return <aside className="account-area"><button className="profile-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{registered ? '●' : '◯'} <span>{registered ? '내 정보' : '로그인'}</span></button>{open && <section className="account-panel">{registered ? <><strong>{user.email}</strong><p>내 키와 저장한 출발지·도착지를 관리할 수 있어요.</p><form onSubmit={saveHeight}><label>키 (cm)<input name="heightCm" type="number" min="100" max="250" value={values.heightCm || profile?.heightCm || ''} onChange={update} required /></label><button className="button" type="submit">키 저장</button></form><button className="text-button" type="button" onClick={loadSavedPlacePairs}>저장한 출발지·도착지 보기</button>{savedPlacePairs && <div className="saved-place-list">{savedPlacePairs.map((pair) => <button className={selectedPairId === pair.id ? 'active' : ''} type="button" key={pair.id} onClick={() => setSelectedPairId(pair.id)}><strong>{pair.data.origin.name}</strong><span>→</span><strong>{pair.data.destination.name}</strong></button>)}</div>}{selectedPairId && <div className="saved-route-time"><label>약속 도착 시간<input type="time" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} required /></label><button className="button" type="button" onClick={startSavedRoute}>이 시간으로 길찾기</button><small>현재 층은 1층 기준으로 계산합니다.</small></div>}<button className="text-button" type="button" onClick={logout}>로그아웃</button></> : <><div className="account-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>로그인</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>회원가입</button></div><form onSubmit={submit}><label>이메일<input name="email" type="email" value={values.email} onChange={update} required autoComplete="email" /></label><label>비밀번호<input name="password" type="password" minLength="6" value={values.password} onChange={update} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>{mode === 'signup' && <label>키 (cm)<input name="heightCm" type="number" min="100" max="250" value={values.heightCm} onChange={update} required /></label>}<button className="button" type="submit">{mode === 'signup' ? '가입하고 저장하기' : '로그인'}</button></form><p className="account-note">로그인하지 않아도 길찾기는 그대로 이용할 수 있어요.</p></>}{status && <p className="field-hint" role="status">{status}</p>}</section>}</aside>
}
