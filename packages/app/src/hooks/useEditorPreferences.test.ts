import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEditorPreferences } from './useEditorPreferences'

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

describe('useEditorPreferences', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('defaults emoji picker to enabled', () => {
    const { result } = renderHook(() => useEditorPreferences())

    expect(result.current.showEmojiPicker).toBe(true)
  })

  it('toggles emoji picker and persists to consolidated preferences', () => {
    const { result } = renderHook(() => useEditorPreferences())

    act(() => {
      result.current.toggleShowEmojiPicker()
    })

    expect(result.current.showEmojiPicker).toBe(false)
    expect(getStoredPreferences().emojiPicker).toBe(false)

    act(() => {
      result.current.toggleShowEmojiPicker()
    })

    expect(result.current.showEmojiPicker).toBe(true)
    expect(getStoredPreferences().emojiPicker).toBe(true)
  })
})
