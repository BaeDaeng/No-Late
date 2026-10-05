export const minutesToSeconds = (minutes) => minutes * 60
export const secondsToMinutes = (seconds) => seconds / 60
export const localDateTimeToIso = (value) => new Date(value).toISOString()
export const isFutureDateTime = (value, now = new Date()) => new Date(value).getTime() > now.getTime()

export function todayTimeToIso(value, now = new Date()) {
  const [hour, minute] = value.split(':').map(Number)
  const appointment = new Date(now)
  appointment.setHours(hour, minute, 0, 0)
  return appointment.toISOString()
}

export function isFutureTodayTime(value, now = new Date()) {
  return Boolean(value) && new Date(todayTimeToIso(value, now)).getTime() > now.getTime()
}
