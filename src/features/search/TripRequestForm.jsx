import { useState } from 'react'
import { apiClient } from '../../services/api/apiClient.js'
import { getCurrentCoordinates } from './geolocation.js'
import { PlaceAutocomplete } from './PlaceAutocomplete.jsx'
import { estimateExitMinutes } from '../../domain/exitEstimate.js'
import { createTripRequest, defaultTripForm, validateTripForm } from './tripRequest.js'
import { getStoredTripForm, saveTripRequest } from './tripRequestStorage.js'

const stored = getStoredTripForm()
const initialForm = stored ? { ...defaultTripForm, ...stored, appointmentTime: new Date(stored.appointmentAt).toTimeString().slice(0, 5), currentFloor: String(stored.currentFloor), heightCm: stored.heightCm ? String(stored.heightCm) : '' } : defaultTripForm

export function TripRequestForm({ onComplete, onError }) {
  const [values, setValues] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [locationStatus, setLocationStatus] = useState('')
  const update = (event) => { const { name, value, type, checked } = event.target; setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })) }
  const setPlace = (key) => (place) => setValues((current) => ({ ...current, [key]: place }))
  const exitMinutes = estimateExitMinutes(values.currentFloor)
  const useCurrentLocation = async () => { try { setLocationStatus('현재 위치를 확인하는 중…'); const coordinates = await getCurrentCoordinates(); const place = await apiClient.reverseGeocode(coordinates); setPlace('origin')(place); setLocationStatus(`${place.name}을(를) 출발지로 선택했습니다.`) } catch (locationError) { setLocationStatus(locationError.message) } }
  const submit = (event) => { event.preventDefault(); const nextErrors = validateTripForm(values); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; try { saveTripRequest(createTripRequest(values)); onComplete() } catch (submitError) { onError(submitError) } }
  return <form className="card" onSubmit={submit} noValidate><div className="form-grid"><div><PlaceAutocomplete label="출발지" selected={values.origin} onSelect={setPlace('origin')} error={errors.origin} /><button className="text-button" type="button" onClick={useCurrentLocation}>현재 위치 사용</button>{locationStatus && <p className="field-hint" role="status">{locationStatus}</p>}</div><PlaceAutocomplete label="목적지" selected={values.destination} onSelect={setPlace('destination')} error={errors.destination} /><Field label="약속 시간 (오늘)" name="appointmentTime" type="time" value={values.appointmentTime} error={errors.appointmentTime} onChange={update} /><label>현재 층<input name="currentFloor" type="number" value={values.currentFloor} onChange={update} />{exitMinutes && <span className="field-hint">건물 밖까지 약 {exitMinutes}분으로 계산됩니다.</span>}{errors.currentFloor && <span className="field-error" role="alert">{errors.currentFloor}</span>}</label><Field label="키 (cm)" name="heightCm" type="number" value={values.heightCm} error={errors.heightCm} onChange={update} /><fieldset className="full"><legend>이동 여유</legend><div className="choices"><Choice name="urgency" value="relaxed" checked={values.urgency === 'relaxed'} onChange={update} label="느긋하게" /><Choice name="urgency" value="normal" checked={values.urgency === 'normal'} onChange={update} label="평범하게" /><Choice name="urgency" value="hurry" checked={values.urgency === 'hurry'} onChange={update} label="서둘러서" /></div><p className="field-hint">신장과 현재 층을 기준으로 보행·퇴실 시간을 자동으로 추정합니다. ‘서둘러서’에는 필요한 경우 뛰는 이동이 포함됩니다.</p></fieldset></div><div className="actions"><button className="button" type="submit">경로 찾기</button></div></form>
}
function Field({ label, error, ...props }) { return <label>{label}<input {...props} />{error && <span className="field-error" role="alert">{error}</span>}</label> }
function Choice({ label, ...props }) { return <label className="choice"><input type="radio" {...props} />{label}</label> }
