import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIsMobile } from './useMobile'

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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

    // Simulate resize
    act(() => {
        window.innerWidth = 500
        const mql = matchMediaMock.mock.results[0].value
        // We need to trigger the listener that was passed to addEventListener
        // Since we mocked addEventListener, we can capture the callback there
        // But simpler might be just to rely on the fact that the hook checks window.innerWidth
        
        // Actually, the hook listens to 'change' on the MediaQueryList.
        // We need to trigger that.
        const listener = mql.addEventListener.mock.calls[0][1]
        listener()
    })

    expect(result.current).toBe(true)
  })
})
