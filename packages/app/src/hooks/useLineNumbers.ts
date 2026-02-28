import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseLineNumbersReturn {
  showLineNumbers: boolean
  toggleLineNumbers: () => void
}

/**
 * Manages Line Numbers visibility state with browser persistence.
 * Line Numbers preference is saved to localStorage and restored on page reload.
 * @returns Current Line Numbers visibility state and toggle function
 */
export function useLineNumbers(): UseLineNumbersReturn {
  const [showLineNumbers, setShowLineNumbersState] = useState<boolean>(() =>
    getBooleanEditorPreference('showLineNumbers', true)
  )

  const toggleLineNumbers = (): void => {
    setShowLineNumbersState((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('showLineNumbers', showLineNumbers)
  }, [showLineNumbers])

  return {
    showLineNumbers,
    toggleLineNumbers,
  }
}
