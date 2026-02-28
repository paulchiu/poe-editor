import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseEditorPreferencesReturn {
  startEmpty: boolean
  showTocPanel: boolean
  toggleStartEmpty: () => void
  toggleShowTocPanel: () => void
}

/**
 * Manages editor preferences with browser persistence.
 * @returns Current preferences and toggle functions
 */
export function useEditorPreferences(): UseEditorPreferencesReturn {
  const [startEmpty, setStartEmpty] = useState<boolean>(() =>
    getBooleanEditorPreference('startEmpty', false)
  )
  const [showTocPanel, setShowTocPanel] = useState<boolean>(() =>
    getBooleanEditorPreference('showTocPanel', false)
  )

  const toggleStartEmpty = (): void => {
    setStartEmpty((current) => !current)
  }

  const toggleShowTocPanel = (): void => {
    setShowTocPanel((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('startEmpty', startEmpty)
  }, [startEmpty])

  useEffect(() => {
    setBooleanEditorPreference('showTocPanel', showTocPanel)
  }, [showTocPanel])

  return {
    startEmpty,
    showTocPanel,
    toggleStartEmpty,
    toggleShowTocPanel,
  }
}
