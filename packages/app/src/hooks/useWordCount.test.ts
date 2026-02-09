import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordCount } from './useWordCount'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useWordCount', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should default to false', () => {
    const { result } = renderHook(() => useWordCount())
    expect(result.current.showWordCount).toBe(false)
  })

  it('should toggle word count visibility', () => {
    const { result } = renderHook(() => useWordCount())

    act(() => {
      result.current.toggleWordCount()
    })

    expect(result.current.showWordCount).toBe(true)
    expect(localStorage.getItem('poe-editor-word-count')).toBe('true')

    act(() => {
      result.current.toggleWordCount()
    })

    expect(result.current.showWordCount).toBe(false)
    expect(localStorage.getItem('poe-editor-word-count')).toBe('false')
  })

  it('should initialize from localStorage', () => {
    localStorage.setItem('poe-editor-word-count', 'true')
    const { result } = renderHook(() => useWordCount())
    expect(result.current.showWordCount).toBe(true)
  })
})
