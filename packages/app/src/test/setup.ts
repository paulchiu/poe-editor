import '@testing-library/jest-dom'

// Mock ResizeObserver for components using ScrollArea
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
