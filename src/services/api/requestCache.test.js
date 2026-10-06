import { beforeEach, describe, expect, it } from 'vitest'
import { cacheRoute, getCachedRoute } from './requestCache.js'

describe('transit route cache', () => {
  beforeEach(() => sessionStorage.clear())
  it('returns a cached route', () => { cacheRoute('same-route', { result: true }); expect(getCachedRoute('same-route')).toEqual({ result: true }) })
})
