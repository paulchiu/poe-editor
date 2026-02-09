import { useEffect, useState } from 'react'

const STORAGE_KEY = 'poe-editor-vim-mode'

interface UseVimModeReturn {
  vimMode: boolean
  toggleVimMode: () => void
}

/**
 * Gets the initial vim mode state from localStorage or defaults to false.
 */
function getInitialVimMode(): boolean {
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
 * Manages Vim mode state with browser persistence.
 * Vim mode preference is saved to localStorage and restored on page reload.
 * @returns Current Vim mode state and toggle function
 */
export function useVimMode(): UseVimModeReturn {
  const [vimMode, setVimModeState] = useState<boolean>(getInitialVimMode)

  const toggleVimMode = (): void => {
    setVimModeState((current) => !current)
  }

  // Persist vim mode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(vimMode))
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [vimMode])

  return {
    vimMode,
    toggleVimMode,
  }
}
