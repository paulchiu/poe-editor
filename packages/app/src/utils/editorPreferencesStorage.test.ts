import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getBooleanEditorPreference,
  getNumberEditorPreference,
  setBooleanEditorPreference,
  setNumberEditorPreference,
} from './editorPreferencesStorage'

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

function getStoredPreferences(): Record<string, unknown> {
  const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

describe('editorPreferencesStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('merges updates into the same consolidated preference object', () => {
    setBooleanEditorPreference('vimMode', true)
    setBooleanEditorPreference('showWordCount', true)
    setBooleanEditorPreference('emojiPicker', false)

    expect(getStoredPreferences()).toEqual({
      vimMode: true,
      showWordCount: true,
      emojiPicker: false,
    })
  })

  it('reads from legacy keys and migrates values to consolidated storage', () => {
    localStorage.setItem('poe-editor-line-numbers', 'false')

    const value = getBooleanEditorPreference('showLineNumbers', true)

    expect(value).toBe(false)
    expect(localStorage.getItem('poe-editor-line-numbers')).toBeNull()
    expect(getStoredPreferences().showLineNumbers).toBe(false)
  })

  it('stores number preferences in the consolidated preference object', () => {
    setBooleanEditorPreference('emojiPicker', true)
    setNumberEditorPreference('previewFontSizePercent', 130, 80, 150)

    expect(getStoredPreferences()).toEqual({
      emojiPicker: true,
      previewFontSizePercent: 130,
    })
  })

  it('reads number preferences with defaults and bounds', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        previewFontSizePercent: 500,
        showWordCount: true,
      })
    )

    expect(getNumberEditorPreference('previewFontSizePercent', 100, 80, 150)).toBe(150)
    expect(getNumberEditorPreference('showWordCount', 100, 80, 150)).toBe(100)
  })

  it('rejects non-finite number preference writes', () => {
    const didWrite = setNumberEditorPreference('previewFontSizePercent', Number.NaN, 80, 150)

    expect(didWrite).toBe(false)
    expect(getStoredPreferences()).toEqual({})
  })
})
