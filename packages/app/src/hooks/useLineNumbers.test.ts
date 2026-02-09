import { renderHook, act } from '@testing-library/react'
import { useLineNumbers } from './useLineNumbers'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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

describe('useLineNumbers', () => {
  const STORAGE_KEY = 'poe-editor-line-numbers'

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('should default to true when no localStorage value exists', () => {
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(true)
  })

  it('should initialize with true from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(true)
  })

  it('should initialize with false from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(false)
  })

  it('should toggle state', () => {
    const { result } = renderHook(() => useLineNumbers())

    expect(result.current.showLineNumbers).toBe(true)

    act(() => {
      result.current.toggleLineNumbers()
    })

    expect(result.current.showLineNumbers).toBe(false)

    act(() => {
      result.current.toggleLineNumbers()
    })

    expect(result.current.showLineNumbers).toBe(true)
  })

  it('should persist changes to localStorage', () => {
    const { result } = renderHook(() => useLineNumbers())

    act(() => {
      result.current.toggleLineNumbers()
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')

    act(() => {
      result.current.toggleLineNumbers()
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })
})
