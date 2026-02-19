import { useEffect, useState } from 'react'

const STORAGE_KEY = 'poe-editor-spell-check'

interface UseSpellCheckReturn {
  spellCheck: boolean
  toggleSpellCheck: () => void
  setSpellCheck: (enabled: boolean) => void
}

/**
 * Gets the initial spell check state from localStorage or defaults to false.
 */
function getInitialSpellCheck(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true' || stored === 'false') {
      return stored === 'true'
    }
  } catch {
    // localStorage not available
  }
  return false
}

/**
 * Manages Spell Check state with browser persistence.
 * Spell Check preference is saved to localStorage and restored on page reload.
 * @returns Current spell check state and toggle function
 */
export function useSpellCheck(): UseSpellCheckReturn {
  const [spellCheck, setSpellCheckState] = useState<boolean>(getInitialSpellCheck)

  const toggleSpellCheck = (): void => {
    setSpellCheckState((current) => !current)
  }

  const setSpellCheck = (enabled: boolean): void => {
    setSpellCheckState(enabled)
  }

  // Persist spell check to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(spellCheck))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [spellCheck])

  return {
    spellCheck,
    toggleSpellCheck,
    setSpellCheck,
  }
}
