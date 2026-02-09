import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>
  let changeListeners: Array<() => void> = []

  beforeEach(() => {
    changeListeners = []
    matchMediaMock = vi.fn((query) => ({
      matches: window.innerWidth < 768,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'change') {
          changeListeners.push(callback)
        }
      }),
      removeEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'change') {
          changeListeners = changeListeners.filter((l) => l !== callback)
        }
      }),
      dispatchEvent: vi.fn(),
    }))
    // @ts-expect-error - Mock doesn't perfectly match MediaQueryList signature, acceptable in tests
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false when width is greater than breakpoint', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true when width is less than breakpoint', () => {
    window.innerWidth = 500
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should update when window resizes', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate resize by changing the mock and triggering listeners
    act(() => {
      window.innerWidth = 500
      // Update the mock to return true for matches
      matchMediaMock.mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, callback: () => void) => {
          if (event === 'change') {
            changeListeners.push(callback)
          }
        }),
        removeEventListener: vi.fn((event: string, callback: () => void) => {
          if (event === 'change') {
            changeListeners = changeListeners.filter((l) => l !== callback)
          }
        }),
        dispatchEvent: vi.fn(),
      }))
      // Trigger all listeners
      changeListeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })
})
