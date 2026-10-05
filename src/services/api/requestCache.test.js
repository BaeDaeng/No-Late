import { beforeEach, describe, expect, it } from 'vitest'
import { cacheRoute, getCachedRoute, getOdsayRequestCount, reserveOdsayRequest } from './requestCache.js'
import { API_LIMITS } from '../../config/apiLimits.js'

describe('ODsay request protection', () => {
  beforeEach(() => sessionStorage.clear())
  it('returns a cached route', () => { cacheRoute('same-route', { result: true }); expect(getCachedRoute('same-route')).toEqual({ result: true }) })
  it('enforces the daily safety limit', () => { for (let index = 0; index < API_LIMITS.odsayDailyRequestLimit; index += 1) reserveOdsayRequest(); expect(getOdsayRequestCount()).toBe(API_LIMITS.odsayDailyRequestLimit); expect(() => reserveOdsayRequest()).toThrow('보호 한도') })
})
