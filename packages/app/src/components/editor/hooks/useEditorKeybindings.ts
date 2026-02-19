import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import { handleTableNavigation } from '../table'

interface UseEditorKeybindingsParams {
  editor: editor.IStandaloneCodeEditor
  onFormat?: (type: 'bold' | 'italic' | 'link' | 'code') => void
  onCodeBlock?: () => void
}

/**
 * Registers custom keybindings on the Monaco editor instance.
 * Handles formatting shortcuts, table navigation, and code block insertion.
 *
 * @param params - Editor instance and format/code block callbacks
 * @returns void
 */
export function registerEditorKeybindings({
  editor,
  onFormat,
  onCodeBlock,
}: UseEditorKeybindingsParams): void {
  if (onFormat) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      onFormat('bold')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      onFormat('italic')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      onFormat('link')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      onFormat('code')
    })
  }

  editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      handleTableNavigation(editor, 1)
    },
    'isInTable && !suggestWidgetVisible'
  )

  editor.addCommand(
    monaco.KeyMod.Shift | monaco.KeyCode.Tab,
    () => {
      handleTableNavigation(editor, -1)
    },
    'isInTable && !suggestWidgetVisible'
  )

  if (onCodeBlock) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      onCodeBlock()
    })
  }
}
