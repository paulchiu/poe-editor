import type { Ref } from 'react'
import type { EmojiShortcodeMatch } from './emojiPickerQuery'

export interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  ref?: Ref<EditorPaneHandle>
  onCursorChange?: (position: { lineNumber: number; column: number; isInTable: boolean }) => void
  theme?: 'light' | 'dark'
  onFormat?: (type: 'bold' | 'italic' | 'link' | 'code') => void
  onCodeBlock?: () => void
  vimMode?: boolean
  displayLineMotion?: boolean
  showWordCount?: boolean
  showLineNumbers?: boolean
  viewMode?: 'editor' | 'preview' | 'split'
  onToggleLayout?: () => void
  spellCheck?: boolean
  onSpellCheckChange?: (enabled: boolean) => void
  emojiPickerEnabled?: boolean
}

export type TableAction =
  | 'insert-table'
  | 'insert-row-above'
  | 'insert-row-below'
  | 'insert-col-left'
  | 'insert-col-right'
  | 'delete-row'
  | 'delete-col'
  | 'format-table'

export interface EmojiPickerState extends EmojiShortcodeMatch {
  top: number
  left: number
}

/**
 * Handle interface for controlling the editor imperatively.
 */
export interface EditorPaneHandle {
  /** Insert text at current cursor position */
  insertText: (text: string) => void
  /** Get currently selected text */
  getSelection: () => string | undefined
  /** Replace currently selected text */
  replaceSelection: (text: string) => void
  /** Get the current selection range */
  getSelectionRange: () => {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  } | null
  /** Get content of a specific line */
  getLineContent: (lineNumber: number) => string | undefined
  /** Set the cursor selection */
  setSelection: (range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }) => void
  /** Get current scroll top */
  getScrollTop: () => number
  /** Set scroll top */
  setScrollTop: (scrollTop: number) => void
  /** Get scroll height */
  getScrollHeight: () => number
  /** Get client height (visible height) */
  getClientHeight: () => number
  /** Register a scroll listener */
  onScroll: (callback: () => void) => { dispose: () => void }
  /** Format the table at the current cursor position */
  formatTable: () => void
  /** Format all tables in the document */
  formatAllTables: () => void
  /** Focus the editor */
  focus: () => void
  /** Perform a table action */
  performTableAction: (action: TableAction) => void
}
