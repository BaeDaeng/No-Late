import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredTripRequest, getStoredTripRequest, saveTripRequest } from './tripRequestStorage.js'
describe('trip request session storage', () => { beforeEach(() => sessionStorage.clear()); it('restores a saved request', () => { const request = { origin: { name: '강남역' } }; saveTripRequest(request); expect(getStoredTripRequest()).toEqual(request) }); it('clears a saved request', () => { saveTripRequest({ origin: { name: '강남역' } }); clearStoredTripRequest(); expect(getStoredTripRequest()).toBeNull() }) })
