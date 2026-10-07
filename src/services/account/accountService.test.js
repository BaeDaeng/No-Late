import { describe, expect, it } from 'vitest'
import { toKoreanAuthError } from './accountService.js'

describe('toKoreanAuthError', () => {
  it('translates invalid login credentials', () => {
    expect(toKoreanAuthError({ message: 'Invalid login credentials' })).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
  })

  it('translates a reused password warning', () => {
    expect(toKoreanAuthError({ message: 'New password should be different from the old password.' })).toBe('새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요.')
  })
})
