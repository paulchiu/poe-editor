import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDisplayLineMotion } from './useDisplayLineMotion'

const PREFERENCES_STORAGE_KEY = 'poe-editor-preferences'

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

describe('useDisplayLineMotion', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('defaults to false', () => {
    const { result } = renderHook(() => useDisplayLineMotion())
    expect(result.current.displayLineMotion).toBe(false)
  })

  it('toggles and persists display-line motion preference', () => {
    const { result } = renderHook(() => useDisplayLineMotion())

    act(() => {
      result.current.toggleDisplayLineMotion()
    })

    expect(result.current.displayLineMotion).toBe(true)
    expect(getStoredPreferences().displayLineMotion).toBe(true)

    act(() => {
      result.current.toggleDisplayLineMotion()
    })

    expect(result.current.displayLineMotion).toBe(false)
    expect(getStoredPreferences().displayLineMotion).toBe(false)
  })
})
