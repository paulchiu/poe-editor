const STORAGE_KEY = 'poe-editor-preferences'

export type EditorPreferenceKey =
  | 'startEmpty'
  | 'showTocPanel'
  | 'showWordCount'
  | 'showLineNumbers'
  | 'vimMode'
  | 'spellCheck'

type EditorPreferenceStore = Partial<Record<EditorPreferenceKey, boolean>>

const LEGACY_STORAGE_KEYS: Partial<Record<EditorPreferenceKey, string>> = {
  showWordCount: 'poe-editor-word-count',
  showLineNumbers: 'poe-editor-line-numbers',
  vimMode: 'poe-editor-vim-mode',
  spellCheck: 'poe-editor-spell-check',
}

function parseBoolean(value: string | null): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function readPreferencesStore(): EditorPreferenceStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const parsed = JSON.parse(stored) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as EditorPreferenceStore
  } catch {
    return {}
  }
}

/**
 * Reads a boolean editor preference from consolidated storage.
 * Falls back to the legacy per-setting key when available and migrates it.
 * @param preferenceKey - Preference key to read.
 * @param defaultValue - Default value when no preference is stored.
 * @returns Stored value or the provided default.
 */
export function getBooleanEditorPreference(
  preferenceKey: EditorPreferenceKey,
  defaultValue: boolean
): boolean {
  const store = readPreferencesStore()
  const storedValue = store[preferenceKey]
  if (typeof storedValue === 'boolean') return storedValue

  const legacyKey = LEGACY_STORAGE_KEYS[preferenceKey]
  if (!legacyKey) return defaultValue

  try {
    const legacyValue = parseBoolean(localStorage.getItem(legacyKey))
    if (legacyValue === null) return defaultValue

    setBooleanEditorPreference(preferenceKey, legacyValue)
    localStorage.removeItem(legacyKey)
    return legacyValue
  } catch {
    return defaultValue
  }
}

/**
 * Writes a boolean editor preference to consolidated storage.
 * @param preferenceKey - Preference key to write.
 * @param value - Boolean value to persist.
 * @returns True when write succeeds, otherwise false.
 */
export function setBooleanEditorPreference(
  preferenceKey: EditorPreferenceKey,
  value: boolean
): boolean {
  try {
    const currentStore = readPreferencesStore()
    const nextStore: EditorPreferenceStore = {
      ...currentStore,
      [preferenceKey]: value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore))

    const legacyKey = LEGACY_STORAGE_KEYS[preferenceKey]
    if (legacyKey) {
      localStorage.removeItem(legacyKey)
    }

    return true
  } catch {
    return false
  }
}
