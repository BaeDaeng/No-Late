import { describe, expect, it } from 'vitest'
import { isRegisteredUser } from './accountService.js'

describe('registered user detection', () => {
  it('treats an email-backed session as a member', () => expect(isRegisteredUser({ email: 'member@example.com', is_anonymous: true })).toBe(true))
  it('keeps anonymous and empty sessions as guests', () => { expect(isRegisteredUser({ is_anonymous: true })).toBe(false); expect(isRegisteredUser(null)).toBe(false) })
})
