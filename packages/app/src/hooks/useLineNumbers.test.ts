import { renderHook, act } from '@testing-library/react'
import { useLineNumbers } from './useLineNumbers'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const PREFERENCES_STORAGE_KEY = 'poe-editor-preferences'
const LEGACY_STORAGE_KEY = 'poe-editor-line-numbers'

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

function getStoredPreferences(): Record<string, unknown> {
  const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useLineNumbers', () => {
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

  it('should initialize with true from consolidated localStorage', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ showLineNumbers: true }))
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(true)
  })

  it('should initialize with false from consolidated localStorage', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ showLineNumbers: false }))
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(false)
  })

  it('should initialize from legacy localStorage key and migrate', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'false')
    const { result } = renderHook(() => useLineNumbers())
    expect(result.current.showLineNumbers).toBe(false)
    expect(getStoredPreferences().showLineNumbers).toBe(false)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
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

    expect(getStoredPreferences().showLineNumbers).toBe(false)

    act(() => {
      result.current.toggleLineNumbers()
    })

    expect(getStoredPreferences().showLineNumbers).toBe(true)
  })
})
