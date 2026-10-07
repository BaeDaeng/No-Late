import { describe, expect, it } from 'vitest'
import { getArrivalLikelihood } from './arrivalLikelihood.js'

describe('getArrivalLikelihood', () => {
  it.each([[0, '매우 높음'], [20, '높음'], [40, '아슬아슬함'], [70, '위험함']])('explains risk score %i in plain language', (score, expected) => {
    expect(getArrivalLikelihood(score).shortLabel).toBe(expected)
  })
})
