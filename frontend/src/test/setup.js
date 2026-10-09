import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

globalThis.fetch = vi.fn()

beforeEach(() => {
  sessionStorage.clear()
  fetch.mockReset()
})
