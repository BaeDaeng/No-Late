import { isFutureTodayTime, todayTimeToIso } from '../../utils/time.js'

export const defaultTripForm = { origin: null, destination: null, appointmentTime: '', withoutAppointment: false, currentFloor: '1', heightCm: '', urgency: 'normal' }

export function validateTripForm(values, now = new Date()) {
  const errors = {}
  if (!values.origin) errors.origin = '검색 결과에서 출발지를 선택해 주세요.'
  if (!values.destination) errors.destination = '검색 결과에서 목적지를 선택해 주세요.'
  if (values.origin && values.destination && (values.origin.id === values.destination.id || (values.origin.latitude === values.destination.latitude && values.origin.longitude === values.destination.longitude))) errors.destination = '출발지와 목적지는 달라야 합니다.'
  if (!values.withoutAppointment) {
    if (!values.appointmentTime) errors.appointmentTime = '오늘의 약속 시간을 입력해 주세요.'
    else if (!isFutureTodayTime(values.appointmentTime, now)) errors.appointmentTime = '약속 시간은 오늘 현재 시각보다 이후여야 합니다.'
  }
  const floor = Number(values.currentFloor)
  if (!Number.isInteger(floor) || floor < -5 || floor > 200) errors.currentFloor = '층수는 지하 5층부터 200층까지 입력할 수 있습니다.'
  if (!values.heightCm) errors.heightCm = '이동 속도를 계산하려면 키를 입력해 주세요.'
  else if (Number(values.heightCm) < 100 || Number(values.heightCm) > 250) errors.heightCm = '키는 100cm부터 250cm까지 입력할 수 있습니다.'
  return errors
}

export function createTripRequest(values, now = new Date()) { return { origin: values.origin, destination: values.destination, appointmentAt: values.withoutAppointment ? null : todayTimeToIso(values.appointmentTime, now), currentFloor: Number(values.currentFloor), heightCm: Number(values.heightCm), urgency: values.urgency } }
