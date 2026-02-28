import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordCount } from './useWordCount'

const PREFERENCES_STORAGE_KEY = 'poe-editor-preferences'
const LEGACY_STORAGE_KEY = 'poe-editor-word-count'

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
    expect(getStoredPreferences().showWordCount).toBe(true)

    act(() => {
      result.current.toggleWordCount()
    })

    expect(result.current.showWordCount).toBe(false)
    expect(getStoredPreferences().showWordCount).toBe(false)
  })

  it('should initialize from legacy localStorage key and migrate', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useWordCount())
    expect(result.current.showWordCount).toBe(true)
    expect(getStoredPreferences().showWordCount).toBe(true)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })
})
