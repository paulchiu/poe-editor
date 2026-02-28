import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseWordCountReturn {
  showWordCount: boolean
  toggleWordCount: () => void
}

/**
 * Manages Word Count visibility state with browser persistence.
 * Word Count preference is saved to localStorage and restored on page reload.
 * @returns Current Word Count visibility state and toggle function
 */
export function useWordCount(): UseWordCountReturn {
  const [showWordCount, setShowWordCountState] = useState<boolean>(() =>
    getBooleanEditorPreference('showWordCount', false)
  )

  const toggleWordCount = (): void => {
    setShowWordCountState((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('showWordCount', showWordCount)
  }, [showWordCount])

  return {
    showWordCount,
    toggleWordCount,
  }
}
