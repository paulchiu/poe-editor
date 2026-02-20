import '@testing-library/jest-dom'

// Mock ResizeObserver for components using ScrollArea
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock document.queryCommandSupported for Monaco editor (clipboard)
// We also force navigator.clipboard to be undefined to satisfy Monaco's check
if (typeof document !== 'undefined') {
  document.queryCommandSupported = vi.fn().mockReturnValue(true)
}

// Force navigator.clipboard to undefined to avoid Monaco using it and falling back to queryCommandSupported
Object.defineProperty(navigator, 'clipboard', {
  value: undefined,
  writable: true,
  configurable: true,
})
