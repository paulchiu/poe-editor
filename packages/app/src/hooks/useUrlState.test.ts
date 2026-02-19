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

  it('should update URL with shareable format when content changes', () => {
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
    // Now using shareable URL format with path segments: /:title/:snippet#hash
    expect(replaceStateSpy.mock.calls[0][2]).toContain('/untitled/')
    expect(replaceStateSpy.mock.calls[0][2]).toContain('#new-hash')

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

  it('should update all favicon links when an emoji is in the heading', () => {
    vi.useFakeTimers()

    // Mock multiple link elements
    const mockLinks = [
      {
        href: '/favicon-32x32.png',
        rel: 'icon',
        type: 'image/png',
        sizes: { value: '32x32' },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
      {
        href: '/favicon.ico',
        rel: 'icon',
        type: 'image/x-icon',
        sizes: { value: '' },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
    ] as unknown as HTMLLinkElement[]

    // Mock querySelectorAll to return our mock links
    const querySelectorAllSpy = vi
      .spyOn(document, 'querySelectorAll')
      .mockReturnValue(mockLinks as unknown as NodeListOf<HTMLLinkElement>)

    const { result } = renderHook(() => useUrlState())
    vi.mocked(compression.compressDocumentToHash).mockReturnValue('hash')

    act(() => {
      // Input with emoji
      result.current.setContent('# 🚀 Blast Off\nContent')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Check if both links were updated
    mockLinks.forEach((link) => {
      expect(link.href).toMatch(/^data:image\/svg\+xml/)
      expect(decodeURIComponent(link.href)).toContain('🚀')
      expect(link.type).toBe('image/svg+xml')
      expect(link.removeAttribute).toHaveBeenCalledWith('sizes')
    })

    // Check if title has emoji stripped
    expect(document.title).toBe('Blast Off')

    // Now update to no emoji
    act(() => {
      result.current.setContent('# Just Text\nContent')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should revert to original state
    expect(mockLinks[0].href).toBe('/favicon-32x32.png')
    expect(mockLinks[0].type).toBe('image/png')
    expect(mockLinks[0].setAttribute).toHaveBeenCalledWith('sizes', '32x32')

    expect(mockLinks[1].href).toBe('/favicon.ico')
    expect(mockLinks[1].type).toBe('image/x-icon')
    // empty sizes might be removed or set to empty, implementation detail:
    // originalFavicons stores sizes: ''
    // if (sizes) check fails for empty string, so removeAttribute called
    expect(mockLinks[1].removeAttribute).toHaveBeenCalledWith('sizes')

    vi.useRealTimers()
    querySelectorAllSpy.mockRestore()
  })
  it('should preserve query parameters when updating URL', () => {
    vi.useFakeTimers()

    // Set up window.location with query params
    const baseUrl = 'http://localhost:3000/?foo=bar'
    Object.defineProperty(window, 'location', {
      value: new URL(baseUrl),
      writable: true,
    })

    const { result } = renderHook(() => useUrlState())

    // Mock history.replaceState to verify the URL being passed
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    act(() => {
      result.current.setContent('New Content')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Check if the URL passed to replaceState contains the query param
    const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1]
    expect(lastCall[2]).toContain('?foo=bar')

    vi.useRealTimers()
  })
})
