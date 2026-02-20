import { useRef, forwardRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import { initVimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import { getAutoContinueEdit } from '@/utils/formatting'
import { cn } from '@/utils/classnames'

import { setupVim } from './vim'
import { getTableAtCursor } from './table'
import { registerEditorKeybindings } from './hooks/useEditorKeybindings'
import { useEditorVim } from './hooks/useEditorVim'
import { useEditorSpellCheck } from './hooks/useEditorSpellCheck'
import { useEditorHandle } from './hooks/useEditorHandle'
import { buildEditorOptions } from './editorOptions'
import { countWords } from './countWords'

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
  spellCheck?: boolean
  onSpellCheckChange?: (enabled: boolean) => void
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
 * Main editor component using Monaco Editor.
 * Supports Vim mode, markdown formatting, and sync scrolling.
 *
 * @param props - Component properties
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
      spellCheck = false,
      onSpellCheckChange,
    },
    ref
  ) => {
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const vimInstanceRef = useRef<VimAdapter | null>(null)
    const statusBarRef = useRef<HTMLDivElement | null>(null)
    const monacoRef = useRef<typeof monaco | null>(null)
    const pendingScrollCallbacks = useRef<
      Array<{ callback: () => void; resolve: (disposable: { dispose: () => void }) => void }>
    >([])
    const [copied, setCopied] = useState(false)

    const checkIsInTable = (model: editor.ITextModel, lineNumber: number): boolean => {
      const lineContent = model.getLineContent(lineNumber)
      if (!lineContent.includes('|')) return false
      return !!getTableAtCursor(model, { lineNumber, column: 1 })
    }

    const handleEditorDidMount: OnMount = (editor, monacoInstance): void => {
      editorRef.current = editor
      setEditorInstance(editor)
      monacoRef.current = monacoInstance

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

      if (onCursorChange) {
        editor.onDidChangeCursorPosition((e) => {
          const model = editor.getModel()
          const isInTable = model ? checkIsInTable(model, e.position.lineNumber) : false
          isInTableContext.set(isInTable)
          onCursorChange({
            lineNumber: e.position.lineNumber,
            column: e.position.column,
            isInTable,
          })
        })
      }

      registerEditorKeybindings({ editor, onFormat, onCodeBlock })

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

            if (result.action === 'exit' || result.action === 'continue') {
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

    useEditorVim({ editorRef, vimInstanceRef, statusBarRef, vimMode })
    useEditorSpellCheck({
      editorRef,
      monacoRef,
      spellCheck,
      vimMode,
      onSpellCheckChange,
      editorInstance,
    })
    useEditorHandle({ ref, editorRef, pendingScrollCallbacks })

    const handleCopy = async (): Promise<void> => {
      try {
        await copyToClipboard(value)
        setCopied(true)
        toast({ description: 'Markdown copied to clipboard' })
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast({
          description: 'Failed to copy to clipboard',
          variant: 'destructive',
        })
      }
    }

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
              options={buildEditorOptions(showLineNumbers ?? true)}
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
              {countWords(value)} words
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
