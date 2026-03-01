import type { RefObject } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import type { EditorPaneHandle } from '@/components/editor'

interface UsePoeEditorKeyboardShortcutsParams {
  handleFormatBold: () => void
  handleFormatItalic: () => void
  handleFormatLink: () => void
  handleFormatCode: () => void
  handleFormatCodeBlock: () => void
  handleSave: () => void
  setShowShortcuts: (show: boolean) => void
  handleNew: () => void
  handleRename: () => void
  handleClear: () => void
  handleCopyLink: () => Promise<void>
  requestReset: () => void
  handleFormatHeading: (level: number) => void
  handleFormatQuote: () => void
  handleFormatBulletList: () => void
  handleFormatNumberedList: () => void
  handleFormatTable: () => void
  handleOpenTransformer: () => void
  handleDownloadMarkdown: () => void
  sourceRef: RefObject<EditorPaneHandle | null>
  documentMenuRef: RefObject<HTMLButtonElement | null>
}

/**
 * Registers Poe editor keyboard shortcuts and binds them to provided handlers.
 * @param params - Callback and ref dependencies used by keyboard shortcuts.
 * @returns Nothing.
 */
export function usePoeEditorKeyboardShortcuts({
  handleFormatBold,
  handleFormatItalic,
  handleFormatLink,
  handleFormatCode,
  handleFormatCodeBlock,
  handleSave,
  setShowShortcuts,
  handleNew,
  handleRename,
  handleClear,
  handleCopyLink,
  requestReset,
  handleFormatHeading,
  handleFormatQuote,
  handleFormatBulletList,
  handleFormatNumberedList,
  handleFormatTable,
  handleOpenTransformer,
  handleDownloadMarkdown,
  sourceRef,
  documentMenuRef,
}: UsePoeEditorKeyboardShortcutsParams): void {
  useKeyboardShortcuts({
    onBold: handleFormatBold,
    onItalic: handleFormatItalic,
    onLink: handleFormatLink,
    onCode: handleFormatCode,
    onCodeBlock: handleFormatCodeBlock,
    onSave: handleSave,
    onHelp: () => setShowShortcuts(true),
    onNew: handleNew,
    onRename: handleRename,
    onClear: handleClear,
    onCopyLink: handleCopyLink,
    onReset: requestReset,
    onHeading: handleFormatHeading,
    onQuote: handleFormatQuote,
    onBulletList: handleFormatBulletList,
    onNumberedList: handleFormatNumberedList,
    onTable: handleFormatTable,
    onTransform: handleOpenTransformer,
    onDownload: handleDownloadMarkdown,
    onFocusEditor: () => sourceRef.current?.focus(),
    onFocusDocument: () => documentMenuRef.current?.focus(),
  })
}
