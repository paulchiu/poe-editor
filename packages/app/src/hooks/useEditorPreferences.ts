import { useEffect, useState } from 'react'

const STORAGE_KEY = 'poe-editor-preferences'

interface EditorPreferences {
  startEmpty: boolean
}

const DEFAULT_PREFERENCES: EditorPreferences = {
  startEmpty: false,
}

interface UseEditorPreferencesReturn extends EditorPreferences {
  toggleStartEmpty: () => void
}

/**
 * Gets the initial preferences from localStorage or defaults.
 */
function getInitialPreferences(): EditorPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
    }
  } catch {
    // localStorage not available or invalid JSON
  }
  return DEFAULT_PREFERENCES
}

/**
 * Manages editor preferences with browser persistence.
 * @returns Current preferences and toggle functions
 */
export function useEditorPreferences(): UseEditorPreferencesReturn {
  const [preferences, setPreferences] = useState<EditorPreferences>(getInitialPreferences)

  const toggleStartEmpty = (): void => {
    setPreferences((current) => ({
      ...current,
      startEmpty: !current.startEmpty,
    }))
  }

  // Persist preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [preferences])

  return {
    ...preferences,
    toggleStartEmpty,
  }
}
