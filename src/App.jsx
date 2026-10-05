import { useEffect, useState } from 'react'
import { Loading } from './components/Loading.jsx'
import { ErrorScreen } from './components/ErrorScreen.jsx'
import { SearchPage } from './pages/SearchPage.jsx'
import { ResultPage } from './pages/ResultPage.jsx'
import { getStoredTripRequest } from './features/search/tripRequestStorage.js'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [error, setError] = useState(null)
  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  const navigate = (nextPath) => { window.history.pushState({}, '', nextPath); setPath(nextPath) }
  if (error) return <ErrorScreen error={error} onRetry={() => setError(null)} />
  if (path === '/result') { const tripRequest = getStoredTripRequest(); return tripRequest ? <ResultPage tripRequest={tripRequest} onBack={() => navigate('/')} /> : <Loading message="입력 정보를 불러오는 중입니다." /> }
  return <SearchPage onComplete={() => navigate('/result')} onError={setError} />
}
export default App
