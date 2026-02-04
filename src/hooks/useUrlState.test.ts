import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUrlState } from './useUrlState'
import * as compression from '../utils/compression'

vi.mock('../utils/compression', () => ({
  compressDocumentToHash: vi.fn(),
  decompressDocumentFromHash: vi.fn(),
}))

describe('useUrlState', () => {
  beforeEach(() => {
    // Reset window.location.hash
    window.location.hash = ''
    vi.clearAllMocks()

    // Mock window.scrollTo to avoid jsdom errors if any
    window.scrollTo = vi.fn()
  })

  it('should initialize with default content', () => {
    const { result } = renderHook(() => useUrlState({ defaultContent: 'Hello' }))
    expect(result.current.content).toBe('Hello')
  })

  it('should initialize from hash', () => {
    window.location.hash = '#compressed-data'
    vi.mocked(compression.decompressDocumentFromHash).mockReturnValue({
      content: 'Decoded Content',
      name: 'decoded.md',
    })

    const { result } = renderHook(() => useUrlState())
    expect(result.current.content).toBe('Decoded Content')
    expect(result.current.documentName).toBe('decoded.md')
  })

  it('should update hash when content changes', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUrlState())

    vi.mocked(compression.compressDocumentToHash).mockReturnValue('new-hash')

    act(() => {
      result.current.setContent('New Content')
    })

    // Fast-forward debounce
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(compression.compressDocumentToHash).toHaveBeenCalledWith({
      content: 'New Content',
      name: 'untitled.md', // default name
    })

    // Verify replaceState was called (implicitly by checking hash? no replaceState doesn't update hash prop in jsdom immediately usually? or does it?)
    // In JSDOM, replaceState updates the history object. window.location.hash usually reflects it.
    // However, the hook uses window.history.replaceState(null, '', newHash)

    // Let's spy on replaceState
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    // Retrigger with spy active
    act(() => {
      result.current.setContent('Newer Content')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(replaceStateSpy).toHaveBeenCalled()
    expect(replaceStateSpy.mock.calls[0][2]).toBe('#new-hash')

    vi.useRealTimers()
  })

  it('should handle decompression errors gracefully', () => {
    window.location.hash = '#garbage'
    vi.mocked(compression.decompressDocumentFromHash).mockImplementation(() => {
      throw new Error('Decompression failed')
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useUrlState({ onError, defaultContent: 'Fallback' }))

    expect(result.current.content).toBe('Fallback')
    expect(onError).toHaveBeenCalled()
  })

  it('should update document title from first heading', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUrlState())

    // Mock compression to return something so updateUrl doesn't fail if it relies on it
    vi.mocked(compression.compressDocumentToHash).mockReturnValue('hash')

    act(() => {
      result.current.setContent('# New Title\nContent')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(document.title).toBe('New Title')
    vi.useRealTimers()
  })
})
