import { describe, expect, it } from 'vitest'
import { estimateExitMinutes } from './exitEstimate.js'

describe('estimateExitMinutes', () => {
  it('includes a minimum building exit allowance', () => expect(estimateExitMinutes(1)).toBe(2))
  it('estimates deeper underground exits conservatively', () => expect(estimateExitMinutes(-3)).toBeGreaterThan(estimateExitMinutes(3)))
})
