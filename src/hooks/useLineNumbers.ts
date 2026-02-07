import { useEffect, useState } from 'react'

const STORAGE_KEY = 'poe-editor-line-numbers'

interface UseLineNumbersReturn {
  showLineNumbers: boolean
  toggleLineNumbers: () => void
}

/**
 * Gets the initial line numbers state from localStorage or defaults to true.
 */
function getInitialLineNumbers(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true' || stored === 'false') {
      return stored === 'true'
    }
  } catch {
    // localStorage not available
  }
  return true
}

/**
 * Manages Line Numbers visibility state with browser persistence.
 * Line Numbers preference is saved to localStorage and restored on page reload.
 * @returns Current Line Numbers visibility state and toggle function
 */
export function useLineNumbers(): UseLineNumbersReturn {
  const [showLineNumbers, setShowLineNumbersState] = useState<boolean>(getInitialLineNumbers)

  const toggleLineNumbers = (): void => {
    setShowLineNumbersState((current) => !current)
  }

  // Persist line numbers state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showLineNumbers))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [showLineNumbers])

  return {
    showLineNumbers,
    toggleLineNumbers,
  }
}
