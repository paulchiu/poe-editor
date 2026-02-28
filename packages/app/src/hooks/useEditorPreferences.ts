import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseEditorPreferencesReturn {
  startEmpty: boolean
  showTocPanel: boolean
  showEmojiPicker: boolean
  toggleStartEmpty: () => void
  toggleShowTocPanel: () => void
  toggleShowEmojiPicker: () => void
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
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(() =>
    getBooleanEditorPreference('emojiPicker', true)
  )

  const toggleStartEmpty = (): void => {
    setStartEmpty((current) => !current)
  }

  const toggleShowTocPanel = (): void => {
    setShowTocPanel((current) => !current)
  }

  const toggleShowEmojiPicker = (): void => {
    setShowEmojiPicker((current) => !current)
  }

  useEffect(() => {
    setBooleanEditorPreference('startEmpty', startEmpty)
  }, [startEmpty])

  useEffect(() => {
    setBooleanEditorPreference('showTocPanel', showTocPanel)
  }, [showTocPanel])

  useEffect(() => {
    setBooleanEditorPreference('emojiPicker', showEmojiPicker)
  }, [showEmojiPicker])

  return {
    startEmpty,
    showTocPanel,
    showEmojiPicker,
    toggleStartEmpty,
    toggleShowTocPanel,
    toggleShowEmojiPicker,
  }
}
