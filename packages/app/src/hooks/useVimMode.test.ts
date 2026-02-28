import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVimMode } from './useVimMode'

const PREFERENCES_STORAGE_KEY = 'poe-editor-preferences'
const LEGACY_STORAGE_KEY = 'poe-editor-vim-mode'

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

describe('useVimMode', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should default to false', () => {
    const { result } = renderHook(() => useVimMode())
    expect(result.current.vimMode).toBe(false)
  })

  it('should toggle mode', () => {
    const { result } = renderHook(() => useVimMode())

    act(() => {
      result.current.toggleVimMode()
    })

    expect(result.current.vimMode).toBe(true)
    expect(getStoredPreferences().vimMode).toBe(true)

    act(() => {
      result.current.toggleVimMode()
    })

    expect(result.current.vimMode).toBe(false)
    expect(getStoredPreferences().vimMode).toBe(false)
  })

  it('should initialize from legacy localStorage key and migrate', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useVimMode())
    expect(result.current.vimMode).toBe(true)
    expect(getStoredPreferences().vimMode).toBe(true)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
  })
})
