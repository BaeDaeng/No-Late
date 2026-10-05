import { describe, expect, it } from 'vitest'
import { getKmaBaseDateTime, pickWeatherForecast, toKmaGrid } from './weather.js'

describe('KMA weather helpers', () => {
  it('converts Seoul coordinates into KMA grid coordinates', () => expect(toKmaGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 }))
  it('uses a published base time', () => expect(getKmaBaseDateTime(new Date('2026-10-06T01:20:00Z'))).toEqual({ baseDate: '20261006', baseTime: '0800' }))
  it('selects the forecast nearest the travel time', () => { const result = pickWeatherForecast([{ fcstDate: '20261006', fcstTime: '1200', category: 'PTY', fcstValue: '1' }, { fcstDate: '20261006', fcstTime: '1200', category: 'PCP', fcstValue: '1.0mm' }], '2026-10-06T03:10:00Z'); expect(result).toMatchObject({ precipitationType: 'rain', precipitationMm: 1 }) })
})
