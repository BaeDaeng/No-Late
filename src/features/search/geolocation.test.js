import { describe, expect, it } from 'vitest'
import { getCurrentCoordinates } from './geolocation.js'

describe('getCurrentCoordinates', () => {
  it('returns coordinates from the browser API', async () => { const geolocation = { getCurrentPosition: (success) => success({ coords: { latitude: 37.5, longitude: 127 } }) }; await expect(getCurrentCoordinates(geolocation)).resolves.toEqual({ latitude: 37.5, longitude: 127 }) })
  it('explains a permission denial', async () => { const geolocation = { getCurrentPosition: (_success, failure) => failure({ code: 1 }) }; await expect(getCurrentCoordinates(geolocation)).rejects.toThrow('권한이 거부') })
})
