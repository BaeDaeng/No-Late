import { useEffect, useState } from 'react'
import { getSharedTrip } from '../services/trips/tripStore.js'
import { getArrivalLikelihood } from '../domain/prediction/arrivalLikelihood.js'
import { Loading } from '../components/Loading.jsx'

export function SharedTripPage({ shareId, onHome }) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  useEffect(() => { getSharedTrip(shareId).then((data) => setState({ loading: false, data, error: null })).catch((error) => setState({ loading: false, data: null, error: error.message })) }, [shareId])
  if (state.loading) return <Loading message="공유 결과를 불러오는 중입니다…" />
  if (state.error) return <main className="page"><section className="card"><h1>공유 결과를 열 수 없습니다</h1><p>{state.error}</p><button className="button" onClick={onHome}>새 경로 찾기</button></section></main>
  const { data } = state
  const likelihood = getArrivalLikelihood(data.prediction.riskScore)
  return <main className="page"><section className="card"><span className="eyebrow">읽기 전용 공유 결과</span><h1>{data.originName} → {data.destinationName}</h1><p>안전 출발 마감: <strong>{new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(data.prediction.leaveByTime))}</strong></p><p>안전 예상 {data.prediction.safeMinutes}분 · {likelihood.label}</p><button className="button" onClick={onHome}>내 경로 찾기</button></section></main>
}
