import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Loading } from './Loading.jsx'
it('shows its loading message', () => { render(<Loading message="경로를 계산하는 중입니다." />); expect(screen.getByRole('status')).toHaveTextContent('경로를 계산하는 중입니다.') })
