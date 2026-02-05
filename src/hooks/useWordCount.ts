import { useEffect, useState } from 'react'

const STORAGE_KEY = 'poe-editor-word-count'

interface UseWordCountReturn {
  showWordCount: boolean
  toggleWordCount: () => void
}

/**
 * Gets the initial word count state from localStorage or defaults to false.
 */
function getInitialWordCount(): boolean {
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
 * Manages Word Count visibility state with browser persistence.
 * Word Count preference is saved to localStorage and restored on page reload.
 * @returns Current Word Count visibility state and toggle function
 */
export function useWordCount(): UseWordCountReturn {
  const [showWordCount, setShowWordCountState] = useState<boolean>(getInitialWordCount)

  const toggleWordCount = (): void => {
    setShowWordCountState((current) => !current)
  }

  // Persist word count state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showWordCount))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [showWordCount])

  return {
    showWordCount,
    toggleWordCount,
  }
}
