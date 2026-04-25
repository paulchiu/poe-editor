import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseVimModeReturn {
  vimMode: boolean
  toggleVimMode: () => void
}

/**
 * Manages Vim mode state with browser persistence.
 * Vim mode preference is saved to localStorage and restored on page reload.
 * @returns Current Vim mode state and toggle function
 */
export function useVimMode(): UseVimModeReturn {
  const [vimMode, setVimMode] = useState<boolean>(() =>
    getBooleanEditorPreference('vimMode', false)
  )

  const toggleVimMode = (): void => {
    setVimMode((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('vimMode', vimMode)
  }, [vimMode])

  return {
    vimMode,
    toggleVimMode,
  }
}
