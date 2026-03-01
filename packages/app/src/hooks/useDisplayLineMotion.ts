import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseDisplayLineMotionReturn {
  displayLineMotion: boolean
  toggleDisplayLineMotion: () => void
}

/**
 * Manages Vim display-line boundary behavior with browser persistence.
 * When enabled, Vim line-boundary keys (0/^/$) operate on wrapped display lines.
 * @returns Current display-line motion state and toggle function
 */
export function useDisplayLineMotion(): UseDisplayLineMotionReturn {
  const [displayLineMotion, setDisplayLineMotionState] = useState<boolean>(() =>
    getBooleanEditorPreference('displayLineMotion', false)
  )

  const toggleDisplayLineMotion = (): void => {
    setDisplayLineMotionState((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('displayLineMotion', displayLineMotion)
  }, [displayLineMotion])

  return {
    displayLineMotion,
    toggleDisplayLineMotion,
  }
}
