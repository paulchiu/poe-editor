const STORAGE_KEY = 'poe-editor-preferences'

export type EditorPreferenceKey =
  | 'startEmpty'
  | 'showTocPanel'
  | 'showWordCount'
  | 'showLineNumbers'
  | 'vimMode'
  | 'displayLineMotion'
  | 'spellCheck'
  | 'emojiPicker'
  | 'previewFontSizePercent'

type EditorPreferenceStore = Partial<Record<EditorPreferenceKey, boolean | number>>

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

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
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

/**
 * Reads a number editor preference from consolidated storage.
 * @param preferenceKey - Preference key to read.
 * @param defaultValue - Default value when no preference is stored.
 * @param minimum - Minimum allowed value.
 * @param maximum - Maximum allowed value.
 * @returns Stored value clamped to bounds, or the provided default.
 */
export function getNumberEditorPreference(
  preferenceKey: EditorPreferenceKey,
  defaultValue: number,
  minimum: number,
  maximum: number
): number {
  const store = readPreferencesStore()
  const storedValue = store[preferenceKey]
  if (typeof storedValue !== 'number' || !Number.isFinite(storedValue)) {
    return defaultValue
  }

  return clampNumber(storedValue, minimum, maximum)
}

/**
 * Writes a number editor preference to consolidated storage.
 * @param preferenceKey - Preference key to write.
 * @param value - Numeric value to persist.
 * @param minimum - Minimum allowed value.
 * @param maximum - Maximum allowed value.
 * @returns True when write succeeds, otherwise false.
 */
export function setNumberEditorPreference(
  preferenceKey: EditorPreferenceKey,
  value: number,
  minimum: number,
  maximum: number
): boolean {
  if (!Number.isFinite(value)) return false

  try {
    const currentStore = readPreferencesStore()
    const nextStore: EditorPreferenceStore = {
      ...currentStore,
      [preferenceKey]: clampNumber(value, minimum, maximum),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore))
    return true
  } catch {
    return false
  }
}
