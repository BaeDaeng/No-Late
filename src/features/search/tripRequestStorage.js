const storageKey = 'no-late:trip-request'
export function saveTripRequest(request) { sessionStorage.setItem(storageKey, JSON.stringify(request)) }
export function getStoredTripRequest() { const value = sessionStorage.getItem(storageKey); return value ? JSON.parse(value) : null }
export function getStoredTripForm() { return getStoredTripRequest() }
