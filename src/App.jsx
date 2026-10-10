import { useEffect, useState } from 'react'
import { Loading } from './components/Loading.jsx'
import { ErrorScreen } from './components/ErrorScreen.jsx'
import { SearchPage } from './pages/SearchPage.jsx'
import { ResultPage } from './pages/ResultPage.jsx'
import { SharedTripPage } from './pages/SharedTripPage.jsx'
import { TransitInfoPage } from './pages/TransitInfoPage.jsx'
import { getStoredTripRequest, saveTripRequest } from './features/search/tripRequestStorage.js'
import { createTripRequest } from './features/search/tripRequest.js'
import { AccountPanel } from './components/AccountPanel.jsx'
import { getProfile, isRegisteredUser, saveProfile } from './services/account/accountService.js'
import { supabase } from './supabase.js'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({ heightCm: null, home: null, work: null })
  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  useEffect(() => {
    if (!supabase) return undefined
    const load = async (nextUser) => { setUser(nextUser || null); if (isRegisteredUser(nextUser)) { try { setProfile(await getProfile(nextUser)) } catch { setProfile({ heightCm: null, home: null, work: null }) } } else setProfile({ heightCm: null, home: null, work: null }) }
    supabase.auth.getUser().then(({ data }) => load(data.user)).catch(() => load(null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user))
    return () => subscription.unsubscribe()
  }, [])
  const navigate = (nextPath) => { window.history.pushState({}, '', nextPath); setPath(nextPath) }
  const updateProfile = async (patch) => { const next = await saveProfile(user, patch); setProfile(next); return next }
  const openSavedPlacePair = ({ origin, destination, appointmentTime, withoutAppointment = false }) => {
    const request = createTripRequest({ origin, destination, appointmentTime, withoutAppointment, currentFloor: '1', heightCm: String(profile.heightCm || ''), urgency: 'normal' })
    saveTripRequest(request)
    navigate('/result')
  }
  if (error) return <ErrorScreen error={error} onRetry={() => setError(null)} />
  const account = <AccountPanel user={user} profile={profile} onUserChange={setUser} onProfileChange={setProfile} onStartSavedRoute={openSavedPlacePair} />
  if (path.startsWith('/share/')) return <>{account}<SharedTripPage shareId={path.split('/')[2]} onHome={() => navigate('/')} /></>
  if (path === '/result') { const tripRequest = getStoredTripRequest(); return <>{account}{tripRequest ? <ResultPage tripRequest={tripRequest} onBack={() => navigate('/')} isRegistered={isRegisteredUser(user)} /> : <Loading message="입력 정보를 불러오는 중입니다." />}</> }
  if (path === '/subway' || path === '/bus') return <>{account}<TransitInfoPage type={path.slice(1)} onNavigate={navigate} favoriteBuses={isRegisteredUser(user) ? profile.favoriteBuses : []} /></>
  return <>{account}<SearchPage onComplete={() => navigate('/result')} onError={setError} profile={profile} isRegistered={isRegisteredUser(user)} onSaveProfile={updateProfile} onNavigate={navigate} /></>
}
export default App
