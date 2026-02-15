import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { initVimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import { getAutoContinueEdit } from '@/utils/formatting'
import {
  formatMarkdownTable,
  insertRow,
  insertColumn,
  deleteRow,
  deleteRows,
  deleteColumn,
  deleteColumns,
} from '@/utils/markdownTable'
import { cn } from '@/utils/classnames'

import { setupVim } from './vim'
import {
  getTableAtCursor,
  handleTableNavigation,
  getTableSelection,
  type TableScope,
} from './table'

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  onCursorChange?: (position: { lineNumber: number; column: number; isInTable: boolean }) => void
  theme?: 'light' | 'dark'
  onFormat?: (type: 'bold' | 'italic' | 'link' | 'code') => void
  onCodeBlock?: () => void
  vimMode?: boolean
  showWordCount?: boolean
  showLineNumbers?: boolean
  viewMode?: 'editor' | 'preview' | 'split'
  onToggleLayout?: () => void
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

/**
 * Handle interface for controlling the editor imperatively
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
  /** Focus the editor */
  focus: () => void
  /** Perform a table action */
  performTableAction: (action: TableAction) => void
}

/**
 * Main editor component using Monaco Editor
 * Supports Vim mode, markdown formatting, and sync scrolling
 *
 * @param props Component properties
 * @returns React component
 */
export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  (
    {
      value,
      onChange,
      onCursorChange,
      theme = 'light',
      onFormat,
      onCodeBlock,
      vimMode,
      showWordCount,
      showLineNumbers,
      viewMode,
      onToggleLayout,
    },
    ref
  ) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const vimInstanceRef = useRef<VimAdapter | null>(null)
    const statusBarRef = useRef<HTMLDivElement | null>(null)
    const pendingScrollCallbacks = useRef<
      Array<{ callback: () => void; resolve: (disposable: { dispose: () => void }) => void }>
    >([])
    const [copied, setCopied] = useState(false)

    // Helper to check if a line is part of a table
    const isTableLine = (lineContent: string) => lineContent.includes('|')

    const checkIsInTable = (model: editor.ITextModel, lineNumber: number) => {
      // Simple check: line contains pipe.
      // More robust: check if it's part of a block with separator.
      // For responsiveness, simple check might be enough, but let's try to be accurate.
      const lineContent = model.getLineContent(lineNumber)
      if (!isTableLine(lineContent)) return false

      // Use helper to detect table
      const position = { lineNumber, column: 1 }
      return !!getTableAtCursor(model, position)
    }

    const handleEditorDidMount: OnMount = (editor, monaco): void => {
      editorRef.current = editor

      // Drain any scroll callbacks that were queued before Monaco mounted
      for (const { callback, resolve } of pendingScrollCallbacks.current) {
        const disposable = editor.onDidScrollChange(() => callback())
        resolve(disposable)
      }
      pendingScrollCallbacks.current = []

      // Initialize vim mode immediately after editor mounts if vimMode is enabled
      if (vimMode) {
        setupVim()
        vimInstanceRef.current = initVimMode(editor, statusBarRef.current)
      }

      // Initialize context key for table detection
      const isInTableContext = editor.createContextKey<boolean>('isInTable', false)

      // Listen for cursor position changes
      if (onCursorChange) {
        editor.onDidChangeCursorPosition((e) => {
          const model = editor.getModel()
          const isInTable = model ? checkIsInTable(model, e.position.lineNumber) : false

          // Update context key
          isInTableContext.set(isInTable)

          onCursorChange({
            lineNumber: e.position.lineNumber,
            column: e.position.column,
            isInTable,
          })
        })
      }

      // Register custom keybindings to override Monaco's defaults
      if (onFormat) {
        // Cmd+B for bold
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
          onFormat('bold')
        })

        // Cmd+I for italic (override Monaco's "Go to Implementation")
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
          onFormat('italic')
        })

        // Cmd+K for link insertion (override Monaco's chord)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
          onFormat('link')
        })

        // Cmd+E for inline code
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
          onFormat('code')
        })
      }

      // Register Tab navigation for tables
      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          // This will only fire if 'isInTable' context is true
          handleTableNavigation(editor, 1)
        },
        'isInTable && !suggestWidgetVisible'
      ) // explicit context check

      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyCode.Tab,
        () => {
          handleTableNavigation(editor, -1)
        },
        'isInTable && !suggestWidgetVisible'
      )

      if (onCodeBlock) {
        // Cmd+Shift+K for code block (override Monaco's delete line)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
          onCodeBlock()
        })
      }

      // Handle Enter key for auto-continuation of lists and quotes
      editor.onKeyDown((e) => {
        if (e.keyCode === monaco.KeyCode.Enter) {
          const position = editor.getPosition()
          if (!position) return

          const model = editor.getModel()
          if (!model) return

          const lineContent = model.getLineContent(position.lineNumber)
          const result = getAutoContinueEdit(lineContent, position.column)

          if (result) {
            e.preventDefault()
            e.stopPropagation()

            if (result.action === 'exit') {
              editor.executeEdits('auto-continue', [
                {
                  range: new monaco.Range(
                    position.lineNumber,
                    result.range.startColumn,
                    position.lineNumber,
                    result.range.endColumn
                  ),
                  text: result.text || '',
                  forceMoveMarkers: true,
                },
              ])
            } else if (result.action === 'continue') {
              editor.executeEdits('auto-continue', [
                {
                  range: new monaco.Range(
                    position.lineNumber,
                    result.range.startColumn,
                    position.lineNumber,
                    result.range.endColumn
                  ),
                  text: result.text || '',
                  forceMoveMarkers: true,
                },
              ])
            }
          }
        }
      })
    }

    // Handle vim mode initialization when editor and status bar are both ready
    useEffect(() => {
      if (!vimMode) {
        // Dispose vim mode when disabled
        if (vimInstanceRef.current) {
          vimInstanceRef.current.dispose()
          vimInstanceRef.current = null
        }
        return
      }

      const ed = editorRef.current
      const statusBar = statusBarRef.current

      if (!ed || !statusBar || vimInstanceRef.current) {
        return
      }

      // Small delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        if (editorRef.current && statusBarRef.current && !vimInstanceRef.current) {
          try {
            vimInstanceRef.current = initVimMode(editorRef.current, statusBarRef.current)
          } catch {
            toast({
              description: 'Error initializing vim mode',
              variant: 'destructive',
            })
          }
        }
      }, 0)

      return () => {
        clearTimeout(timer)
      }
    }, [vimMode])

    const handleCopy = async (): Promise<void> => {
      try {
        await copyToClipboard(value)
        setCopied(true)
        toast({ description: 'Markdown copied to clipboard!' })
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast({
          description: 'Failed to copy to clipboard',
          variant: 'destructive',
        })
      }
    }

    // Expose methods to parent via ref
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

        // Move cursor after inserted text
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
        // Editor not mounted yet — queue the callback and return a disposable
        // that will dispose the real listener once it's attached
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

      performTableAction: (action: TableAction) => {
        const editor = editorRef.current
        if (!editor) return

        if (action === 'insert-table') {
          // 2x2 (includes header) default table
          const table = `
|     |     |
| --- | --- |
|     |     |
`.trim()

          const position = editor.getPosition()
          if (!position) return

          const model = editor.getModel()
          if (!model) return

          // Check current line content
          const lineContent = model.getLineContent(position.lineNumber)
          if (lineContent.trim() !== '') {
            // Insert on new line
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
            // Insert on current line
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

        // Try to get selection-based table scope first to handle multi-select
        const tableSelection = getTableSelection(model, selection)

        let tableData: TableScope | null = null
        if (tableSelection) {
          tableData = tableSelection.tableScope
        } else {
          // Fallback to cursor position
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

          // Restore focus/cursor if possible?
          // For now ensuring focus is good enough.
          editor.focus()
        }
      },

      focus: () => {
        editorRef.current?.focus()
      },
    }))

    return (
      <div className="relative h-full group bg-background flex flex-col overflow-hidden rounded-lg border border-border">
        <div className="flex-1 min-h-0">
          <div className="relative h-full">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onToggleLayout && viewMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onToggleLayout}
                      className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border text-foreground"
                    >
                      {viewMode === 'split' ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      {viewMode === 'split' ? 'Expand Editor' : 'Restore Split View'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopy}
                    className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border text-foreground"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Copy Markdown</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Editor
              height="100%"
              language="markdown"
              value={value}
              onChange={(value) => onChange(value ?? '')}
              onMount={handleEditorDidMount}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                lineNumbers: (showLineNumbers ?? true) ? 'on' : 'off',
                fontSize: 14,
                lineHeight: 22,
                fontFamily:
                  "'JetBrains Mono', 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
                fontLigatures: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: false, // Explicitly disable smooth scrolling for sync
                unicodeHighlight: {
                  ambiguousCharacters: false,
                },
              }}
            />
          </div>
        </div>
        {showWordCount && (
          <div
            className={cn(
              'absolute right-4 z-10 pointer-events-none transition-all duration-300',
              vimMode ? 'bottom-10' : 'bottom-4'
            )}
          >
            <span className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
              {
                value
                  .trim()
                  .split(/\s+/)
                  .filter((w) => w.length > 0).length
              }{' '}
              words
            </span>
          </div>
        )}
        {vimMode && (
          <div
            ref={statusBarRef}
            className="vim-status-bar h-6 border-t border-border bg-background font-mono text-xs flex items-center overflow-hidden"
            style={{
              fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
            }}
          />
        )}
      </div>
    )
  }
)

EditorPane.displayName = 'EditorPane'
