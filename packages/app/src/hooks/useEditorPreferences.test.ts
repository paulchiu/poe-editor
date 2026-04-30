import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PREVIEW_FONT_SIZE_DEFAULT_PERCENT,
  PREVIEW_FONT_SIZE_MAX_PERCENT,
  PREVIEW_FONT_SIZE_MIN_PERCENT,
  PREVIEW_FONT_SIZE_STEP_PERCENT,
  useEditorPreferences,
} from './useEditorPreferences'

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

  it('adjusts preview font size within bounds and persists it', () => {
    const { result } = renderHook(() => useEditorPreferences())

    expect(result.current.previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_DEFAULT_PERCENT)
    expect(result.current.canDecreasePreviewFontSize).toBe(true)
    expect(result.current.canIncreasePreviewFontSize).toBe(true)

    act(() => {
      result.current.increasePreviewFontSize()
    })

    expect(result.current.previewFontSizePercent).toBe(
      PREVIEW_FONT_SIZE_DEFAULT_PERCENT + PREVIEW_FONT_SIZE_STEP_PERCENT
    )
    expect(getStoredPreferences().previewFontSizePercent).toBe(
      PREVIEW_FONT_SIZE_DEFAULT_PERCENT + PREVIEW_FONT_SIZE_STEP_PERCENT
    )

    for (let i = 0; i < 10; i += 1) {
      act(() => {
        result.current.decreasePreviewFontSize()
      })
    }

    expect(result.current.previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_MIN_PERCENT)
    expect(result.current.canDecreasePreviewFontSize).toBe(false)
    expect(getStoredPreferences().previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_MIN_PERCENT)

    for (let i = 0; i < 4; i += 1) {
      act(() => {
        result.current.increasePreviewFontSize()
      })
    }

    expect(result.current.previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_DEFAULT_PERCENT)

    for (let i = 0; i < 20; i += 1) {
      act(() => {
        result.current.increasePreviewFontSize()
      })
    }

    expect(result.current.previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_MAX_PERCENT)
    expect(result.current.canIncreasePreviewFontSize).toBe(false)
    expect(getStoredPreferences().previewFontSizePercent).toBe(PREVIEW_FONT_SIZE_MAX_PERCENT)
  })

  it('loads persisted preview font size on first render', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ previewFontSizePercent: 130 }))

    const { result } = renderHook(() => useEditorPreferences())

    expect(result.current.previewFontSizePercent).toBe(130)
  })
})
