import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useViewMode } from './useViewMode'

describe('useViewMode', () => {
  let originalLocation: Location

  beforeEach(() => {
    // Mock window.location
    originalLocation = window.location
    const mockLocation = new URL('http://localhost/') as unknown as Location
    // Need to allow assignment
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: mockLocation,
    })

    // Mock history.replaceState
    window.history.replaceState = vi.fn()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true, // Make sure to restore writability if needed
      value: originalLocation,
    })
    vi.restoreAllMocks()
  })

  it('should initialize with default split mode', () => {
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('split')
  })

  it('should initialize from URL query param', () => {
    window.location.search = '?view=editor'
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('editor')
  })

  it('should default to split if param is invalid', () => {
    window.location.search = '?view=invalid'
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('split')
  })

  it('should update state and URL when setting mode', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => {
      result.current.setViewMode('preview')
    })

    expect(result.current.viewMode).toBe('preview')

    // Check replaceState call
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const calls = replaceStateSpy.mock.calls
    const lastCall = calls[calls.length - 1]
    // Expect 'http://localhost/?view=preview'
    expect(lastCall[2]).toContain('view=preview')
  })

  it('should remove query param when setting to split', () => {
    window.location.search = '?view=editor'
    const { result } = renderHook(() => useViewMode())

    act(() => {
      result.current.setViewMode('split')
    })

    expect(result.current.viewMode).toBe('split')

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const calls = replaceStateSpy.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[2]).not.toContain('view=')
  })

  it('should preserve other query params', () => {
    // Setup initial URL with other params
    // Note: setting window.location per test in beforeEach setup,
    // effectively we need to set search on the mock object.
    // Assuming the mock setup allows setting search.
    // The URL object's search property is read-only in some envs but writable in JSDOM usually via setter

    // Let's rely on constructing the URL in setup.
    // Re-mock for this specific test to include other params
    const url = new URL('http://localhost/?other=123&view=editor')
    Object.defineProperty(window, 'location', {
      value: url,
      writable: true,
    })

    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('editor')

    act(() => {
      result.current.setViewMode('preview')
    })

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const lastCallArgs = replaceStateSpy.mock.lastCall
    expect(lastCallArgs?.[2]).toContain('other=123')
    expect(lastCallArgs?.[2]).toContain('view=preview')
  })
})
