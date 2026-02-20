import type React from 'react'
import { useImperativeHandle } from 'react'
import type { editor } from 'monaco-editor'
import { toast } from '@/hooks/useToast'
import {
  formatMarkdownTable,
  insertRow,
  insertColumn,
  deleteRow,
  deleteRows,
  deleteColumn,
  deleteColumns,
} from '@/utils/markdownTable'
import { getTableAtCursor, getTableSelection } from '../table'
import type { TableAction, EditorPaneHandle } from '../EditorPane'

interface UseEditorHandleParams {
  ref: React.ForwardedRef<EditorPaneHandle>
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  pendingScrollCallbacks: React.MutableRefObject<
    Array<{ callback: () => void; resolve: (disposable: { dispose: () => void }) => void }>
  >
}

/**
 * Exposes imperative editor methods to parent components via ref.
 * Handles text insertion, selection, scrolling, table formatting, and table actions.
 *
 * @param params - Forwarded ref, editor ref, and pending scroll callbacks
 * @returns void
 */
export function useEditorHandle({
  ref,
  editorRef,
  pendingScrollCallbacks,
}: UseEditorHandleParams): void {
  useImperativeHandle(ref, () => ({
    insertText: (text: string): void => {
      const editor = editorRef.current
      if (!editor) return

      const position = editor.getPosition()
      if (!position) return

      editor.executeEdits('', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text,
        },
      ])

      const lines = text.split('\n')
      const lastLine = lines[lines.length - 1]
      if (lastLine !== undefined) {
        const newPosition = {
          lineNumber: position.lineNumber + lines.length - 1,
          column: lines.length === 1 ? position.column + text.length : lastLine.length + 1,
        }
        editor.setPosition(newPosition)
      }

      editor.focus()
    },

    getSelection: (): string | undefined => {
      const editor = editorRef.current
      if (!editor) return undefined

      const selection = editor.getSelection()
      if (!selection) return undefined

      return editor.getModel()?.getValueInRange(selection)
    },

    replaceSelection: (text: string): void => {
      const editor = editorRef.current
      if (!editor) return

      const selection = editor.getSelection()
      if (!selection) return

      editor.executeEdits('', [
        {
          range: selection,
          text,
        },
      ])

      editor.focus()
    },

    getSelectionRange: () => {
      const editor = editorRef.current
      if (!editor) return null
      const selection = editor.getSelection()
      if (!selection) return null
      return {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn,
      }
    },

    getLineContent: (lineNumber: number) => {
      const editor = editorRef.current
      if (!editor) return undefined
      return editor.getModel()?.getLineContent(lineNumber)
    },

    setSelection: (range) => {
      const editor = editorRef.current
      if (!editor) return
      editor.setSelection(range)
      editor.focus()
    },

    getScrollTop: () => editorRef.current?.getScrollTop() ?? 0,
    setScrollTop: (scrollTop) => editorRef.current?.setScrollTop(scrollTop),
    getScrollHeight: () => editorRef.current?.getScrollHeight() ?? 0,
    getClientHeight: () => editorRef.current?.getLayoutInfo().height ?? 0,
    onScroll: (callback) => {
      if (editorRef.current) {
        const disposable = editorRef.current.onDidScrollChange(() => {
          callback()
        })
        return disposable
      }
      let realDisposable: { dispose: () => void } | null = null
      let disposed = false
      pendingScrollCallbacks.current.push({
        callback,
        resolve: (d) => {
          if (disposed) {
            d.dispose()
          } else {
            realDisposable = d
          }
        },
      })
      return {
        dispose: () => {
          disposed = true
          realDisposable?.dispose()
        },
      }
    },

    formatTable: () => {
      const editor = editorRef.current
      if (!editor) return

      const position = editor.getPosition()
      if (!position) return

      const model = editor.getModel()
      if (!model) return

      const tableData = getTableAtCursor(model, position)
      if (!tableData) {
        toast({ description: "Couldn't find a table at cursor" })
        return
      }

      const { range, text } = tableData
      const formatted = formatMarkdownTable(text)

      if (formatted !== text && editorRef.current) {
        editorRef.current.executeEdits('format-table', [
          {
            range,
            text: formatted,
            forceMoveMarkers: true,
          },
        ])
      }
    },

    focus: () => {
      editorRef.current?.focus()
    },

    performTableAction: (action: TableAction) => {
      const editor = editorRef.current
      if (!editor) return

      if (action === 'insert-table') {
        const table = `
|     |     |
| --- | --- |
|     |     |
`.trim()

        const position = editor.getPosition()
        if (!position) return

        const model = editor.getModel()
        if (!model) return

        const lineContent = model.getLineContent(position.lineNumber)
        if (lineContent.trim() !== '') {
          const insertText = '\n\n' + table
          editor.executeEdits('insert-table', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: lineContent.length + 1,
                endLineNumber: position.lineNumber,
                endColumn: lineContent.length + 1,
              },
              text: insertText,
              forceMoveMarkers: true,
            },
          ])
        } else {
          editor.executeEdits('insert-table', [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: lineContent.length + 1,
              },
              text: table,
              forceMoveMarkers: true,
            },
          ])
        }
        editor.focus()
        return
      }

      const model = editor.getModel()
      if (!model) return

      const selection = editor.getSelection()
      if (!selection) return

      const tableSelection = getTableSelection(model, selection)

      let tableData = tableSelection ? tableSelection.tableScope : null
      if (!tableData) {
        const position = editor.getPosition()
        if (!position) return
        tableData = getTableAtCursor(model, position)
      }

      if (!tableData) {
        toast({ description: 'Not inside a table' })
        return
      }

      const { range, text, rowIndex, colIndex } = tableData
      let newText = text

      switch (action) {
        case 'insert-row-above':
          newText = insertRow(text, rowIndex, 'above')
          break
        case 'insert-row-below':
          newText = insertRow(text, rowIndex, 'below')
          break
        case 'insert-col-left':
          newText = insertColumn(text, colIndex, 'left')
          break
        case 'insert-col-right':
          newText = insertColumn(text, colIndex, 'right')
          break
        case 'delete-row':
          if (tableSelection && tableSelection.selectedRowIndices.length > 0) {
            newText = deleteRows(text, tableSelection.selectedRowIndices)
          } else {
            newText = deleteRow(text, rowIndex)
          }
          break
        case 'delete-col':
          if (tableSelection && tableSelection.selectedColIndices.length > 0) {
            newText = deleteColumns(text, tableSelection.selectedColIndices)
          } else {
            newText = deleteColumn(text, colIndex)
          }
          break
        case 'format-table':
          newText = formatMarkdownTable(text)
          break
      }

      if (newText !== text) {
        editor.executeEdits('table-action', [
          {
            range,
            text: newText,
            forceMoveMarkers: true,
          },
        ])
        editor.focus()
      }
    },
  }))
}
