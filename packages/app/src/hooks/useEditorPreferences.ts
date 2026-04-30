import { useEffect, useState } from 'react'
import {
  getBooleanEditorPreference,
  getNumberEditorPreference,
  setBooleanEditorPreference,
  setNumberEditorPreference,
} from '@/utils/editorPreferencesStorage'

export const PREVIEW_FONT_SIZE_MIN_PERCENT = 75
export const PREVIEW_FONT_SIZE_MAX_PERCENT = 150
export const PREVIEW_FONT_SIZE_STEP_PERCENT = 10
export const PREVIEW_FONT_SIZE_DEFAULT_PERCENT = 100

interface UseEditorPreferencesReturn {
  startEmpty: boolean
  showTocPanel: boolean
  showEmojiPicker: boolean
  previewFontSizePercent: number
  canDecreasePreviewFontSize: boolean
  canIncreasePreviewFontSize: boolean
  toggleStartEmpty: () => void
  toggleShowTocPanel: () => void
  toggleShowEmojiPicker: () => void
  decreasePreviewFontSize: () => void
  increasePreviewFontSize: () => void
}

function clampPreviewFontSizePercent(value: number): number {
  return Math.min(Math.max(value, PREVIEW_FONT_SIZE_MIN_PERCENT), PREVIEW_FONT_SIZE_MAX_PERCENT)
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
  const [previewFontSizePercent, setPreviewFontSizePercent] = useState<number>(() =>
    getNumberEditorPreference(
      'previewFontSizePercent',
      PREVIEW_FONT_SIZE_DEFAULT_PERCENT,
      PREVIEW_FONT_SIZE_MIN_PERCENT,
      PREVIEW_FONT_SIZE_MAX_PERCENT
    )
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

  const decreasePreviewFontSize = (): void => {
    setPreviewFontSizePercent((current) =>
      clampPreviewFontSizePercent(current - PREVIEW_FONT_SIZE_STEP_PERCENT)
    )
  }

  const increasePreviewFontSize = (): void => {
    setPreviewFontSizePercent((current) =>
      clampPreviewFontSizePercent(current + PREVIEW_FONT_SIZE_STEP_PERCENT)
    )
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

  useEffect(() => {
    setNumberEditorPreference(
      'previewFontSizePercent',
      previewFontSizePercent,
      PREVIEW_FONT_SIZE_MIN_PERCENT,
      PREVIEW_FONT_SIZE_MAX_PERCENT
    )
  }, [previewFontSizePercent])

  return {
    startEmpty,
    showTocPanel,
    showEmojiPicker,
    previewFontSizePercent,
    canDecreasePreviewFontSize: previewFontSizePercent > PREVIEW_FONT_SIZE_MIN_PERCENT,
    canIncreasePreviewFontSize: previewFontSizePercent < PREVIEW_FONT_SIZE_MAX_PERCENT,
    toggleStartEmpty,
    toggleShowTocPanel,
    toggleShowEmojiPicker,
    decreasePreviewFontSize,
    increasePreviewFontSize,
  }
}
