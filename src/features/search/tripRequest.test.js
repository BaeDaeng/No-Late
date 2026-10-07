import { describe, expect, it } from 'vitest'
import { createTripRequest, defaultTripForm, validateTripForm } from './tripRequest.js'

const origin = { id: 'origin', name: '강남역', latitude: 127.0276, longitude: 37.4979 }
const destination = { id: 'destination', name: '시청역', latitude: 126.9779, longitude: 37.5663 }
const future = '12:00'

describe('trip request validation', () => {
  it('requires selected places and height', () => expect(validateTripForm({ ...defaultTripForm, appointmentTime: future })).toMatchObject({ origin: expect.any(String), destination: expect.any(String), heightCm: expect.any(String) }))
  it('rejects an already passed time today', () => expect(validateTripForm({ ...defaultTripForm, origin, destination, heightCm: '170', appointmentTime: '08:00' }, new Date('2025-01-01T09:00:00'))).toHaveProperty('appointmentTime'))
  it('creates a normalized TripRequest for today', () => { const request = createTripRequest({ ...defaultTripForm, origin, destination, heightCm: '170', appointmentTime: future }, new Date('2030-01-02T09:00:00')); expect(request).toMatchObject({ origin, destination, currentFloor: 1, heightCm: 170, urgency: 'normal' }); expect(request.appointmentAt).toBe('2030-01-02T03:00:00.000Z') })
  it('allows a route without an appointment time', () => { const values = { ...defaultTripForm, origin, destination, heightCm: '170', withoutAppointment: true }; expect(validateTripForm(values)).not.toHaveProperty('appointmentTime'); expect(createTripRequest(values).appointmentAt).toBeNull() })
})
