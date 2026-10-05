import { beforeEach, describe, expect, it } from 'vitest'
import { getStoredTripRequest, saveTripRequest } from './tripRequestStorage.js'
describe('trip request session storage', () => { beforeEach(() => sessionStorage.clear()); it('restores a saved request', () => { const request = { origin: { name: '강남역' } }; saveTripRequest(request); expect(getStoredTripRequest()).toEqual(request) }) })
