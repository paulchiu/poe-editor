import { useRef, useEffect, useMemo, forwardRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import type { VimMode as VimAdapter } from 'monaco-vim'
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import { getAutoContinueEdit } from '@/utils/formatting'
import { cn } from '@/utils/classnames'
import { filterEmojiShortcodeEntries, getEmojiShortcodeEntries } from '@/utils/emojiShortcodes'

import { getTableAtCursor } from './table'
import { registerEditorKeybindings } from './hooks/useEditorKeybindings'
import { useEditorVim } from './hooks/useEditorVim'
import { useEditorSpellCheck } from './hooks/useEditorSpellCheck'
import { useEditorHandle } from './hooks/useEditorHandle'
import { buildEditorOptions } from './editorOptions'
import { countWords } from './countWords'
import { getEmojiShortcodeQueryAtCursor, type EmojiShortcodeMatch } from './emojiPickerQuery'

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
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

interface EmojiPickerState extends EmojiShortcodeMatch {
  top: number
  left: number
}

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
      displayLineMotion = false,
      showWordCount,
      showLineNumbers,
      viewMode,
      onToggleLayout,
      spellCheck = false,
      onSpellCheckChange,
      emojiPickerEnabled = true,
    },
    ref
  ) => {
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)
    const vimInstanceRef = useRef<VimAdapter | null>(null)
    const statusBarRef = useRef<HTMLDivElement | null>(null)
    const monacoRef = useRef<typeof monaco | null>(null)
    const pendingScrollCallbacks = useRef<
      Array<{ callback: () => void; resolve: (disposable: { dispose: () => void }) => void }>
    >([])
    const emojiPickerRef = useRef<HTMLDivElement | null>(null)
    const emojiPickerStateRef = useRef<EmojiPickerState | null>(null)
    const filteredEmojiEntriesRef = useRef<Array<{ shortcode: string; emoji: string }>>([])
    const selectedEmojiIndexRef = useRef(0)
    const emojiLoadRequestRef = useRef(0)
    const emojiPickerEnabledRef = useRef(emojiPickerEnabled)
    const hasLoadedEmojiEntriesRef = useRef(false)
    const isEmojiLoadingRef = useRef(false)
    const [copied, setCopied] = useState(false)
    const [emojiPickerState, setEmojiPickerState] = useState<EmojiPickerState | null>(null)
    const [emojiEntries, setEmojiEntries] = useState<Array<{ shortcode: string; emoji: string }>>(
      []
    )
    const [isEmojiLoading, setIsEmojiLoading] = useState(false)
    const [emojiLoadError, setEmojiLoadError] = useState<string | null>(null)
    const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0)

    const filteredEmojiEntries = useMemo(() => {
      if (!emojiPickerState) return []
      return filterEmojiShortcodeEntries(emojiEntries, emojiPickerState.query, 24)
    }, [emojiEntries, emojiPickerState])
    const activeSelectedEmojiIndex =
      filteredEmojiEntries.length === 0
        ? 0
        : Math.min(selectedEmojiIndex, filteredEmojiEntries.length - 1)

    const ensureEmojiEntriesLoaded = (): void => {
      if (hasLoadedEmojiEntriesRef.current || isEmojiLoadingRef.current) return

      const requestId = emojiLoadRequestRef.current + 1
      emojiLoadRequestRef.current = requestId
      isEmojiLoadingRef.current = true
      setIsEmojiLoading(true)
      setEmojiLoadError(null)

      void getEmojiShortcodeEntries()
        .then((entries) => {
          if (emojiLoadRequestRef.current !== requestId) return
          hasLoadedEmojiEntriesRef.current = true
          setEmojiEntries(entries)
        })
        .catch(() => {
          if (emojiLoadRequestRef.current !== requestId) return
          setEmojiLoadError('Unable to load emoji list')
        })
        .finally(() => {
          if (emojiLoadRequestRef.current !== requestId) return
          isEmojiLoadingRef.current = false
          setIsEmojiLoading(false)
        })
    }

    const checkIsInTable = (model: editor.ITextModel, lineNumber: number): boolean => {
      const lineContent = model.getLineContent(lineNumber)
      if (!lineContent.includes('|')) return false
      return !!getTableAtCursor(model, { lineNumber, column: 1 })
    }

    const handleInsertEmojiShortcode = (shortcode: string): void => {
      const activeEditor = editorRef.current
      const activePicker = emojiPickerStateRef.current
      if (!activeEditor || !activePicker) return

      const replacement = `:${shortcode}:`
      activeEditor.executeEdits('emoji-picker', [
        {
          range: new monaco.Range(
            activePicker.lineNumber,
            activePicker.startColumn,
            activePicker.lineNumber,
            activePicker.endColumn
          ),
          text: replacement,
          forceMoveMarkers: true,
        },
      ])

      activeEditor.setPosition({
        lineNumber: activePicker.lineNumber,
        column: activePicker.startColumn + replacement.length,
      })
      activeEditor.focus()
      setEmojiPickerState(null)
      setSelectedEmojiIndex(0)
    }

    const handleEditorDidMount: OnMount = (editor, monacoInstance): void => {
      editorRef.current = editor
      setEditorInstance(editor)
      monacoRef.current = monacoInstance

      // Focus on initial mount whenever the editor pane is visible.
      if (viewMode !== 'preview') {
        editor.focus()
      }

      // Drain any scroll callbacks that were queued before Monaco mounted
      for (const { callback, resolve } of pendingScrollCallbacks.current) {
        const disposable = editor.onDidScrollChange(() => callback())
        resolve(disposable)
      }
      pendingScrollCallbacks.current = []

      // Initialize context key for table detection
      const isInTableContext = editor.createContextKey<boolean>('isInTable', false)

      const updateEmojiPickerFromCursor = (): void => {
        if (!emojiPickerEnabledRef.current) {
          setEmojiPickerState(null)
          setSelectedEmojiIndex(0)
          return
        }

        const model = editor.getModel()
        const position = editor.getPosition()
        if (!model || !position) {
          setEmojiPickerState(null)
          setSelectedEmojiIndex(0)
          return
        }

        const shortcodeQuery = getEmojiShortcodeQueryAtCursor(model, position)
        if (!shortcodeQuery) {
          setEmojiPickerState(null)
          setSelectedEmojiIndex(0)
          return
        }

        const visiblePosition = editor.getScrolledVisiblePosition(position)
        if (!visiblePosition) {
          setEmojiPickerState(null)
          setSelectedEmojiIndex(0)
          return
        }

        const layout = editor.getLayoutInfo()
        const pickerWidth = 320
        const sidePadding = 12
        const maxLeft = Math.max(sidePadding, layout.width - pickerWidth - sidePadding)
        const left = Math.min(Math.max(sidePadding, visiblePosition.left), maxLeft)
        const top = visiblePosition.top + visiblePosition.height + 8

        if (emojiPickerStateRef.current?.query !== shortcodeQuery.query) {
          setSelectedEmojiIndex(0)
        }
        setEmojiPickerState({
          ...shortcodeQuery,
          top,
          left,
        })
        ensureEmojiEntriesLoaded()
      }

      editor.onDidChangeCursorPosition((e) => {
        const model = editor.getModel()
        const isInTable = model ? checkIsInTable(model, e.position.lineNumber) : false
        isInTableContext.set(isInTable)

        if (onCursorChange) {
          onCursorChange({
            lineNumber: e.position.lineNumber,
            column: e.position.column,
            isInTable,
          })
        }

        updateEmojiPickerFromCursor()
      })

      editor.onDidChangeModelContent(() => {
        updateEmojiPickerFromCursor()
      })

      registerEditorKeybindings({ editor, onFormat, onCodeBlock })
      updateEmojiPickerFromCursor()

      // Handle Enter key for auto-continuation of lists and quotes
      editor.onKeyDown((e) => {
        if (emojiPickerStateRef.current) {
          if (e.keyCode === monaco.KeyCode.Escape) {
            e.preventDefault()
            e.stopPropagation()
            setEmojiPickerState(null)
            setSelectedEmojiIndex(0)
            return
          }

          if (
            e.keyCode === monaco.KeyCode.DownArrow &&
            filteredEmojiEntriesRef.current.length > 0
          ) {
            e.preventDefault()
            e.stopPropagation()
            const nextIndex =
              (selectedEmojiIndexRef.current + 1) % filteredEmojiEntriesRef.current.length
            setSelectedEmojiIndex(nextIndex)
            return
          }

          if (e.keyCode === monaco.KeyCode.UpArrow && filteredEmojiEntriesRef.current.length > 0) {
            e.preventDefault()
            e.stopPropagation()
            const nextIndex =
              (selectedEmojiIndexRef.current - 1 + filteredEmojiEntriesRef.current.length) %
              filteredEmojiEntriesRef.current.length
            setSelectedEmojiIndex(nextIndex)
            return
          }

          if (
            (e.keyCode === monaco.KeyCode.Enter || e.keyCode === monaco.KeyCode.Space) &&
            filteredEmojiEntriesRef.current.length > 0
          ) {
            e.preventDefault()
            e.stopPropagation()
            const clampedIndex = Math.min(
              selectedEmojiIndexRef.current,
              filteredEmojiEntriesRef.current.length - 1
            )
            const selectedEntry = filteredEmojiEntriesRef.current[clampedIndex]
            if (selectedEntry) {
              handleInsertEmojiShortcode(selectedEntry.shortcode)
              return
            }
          }
        }

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

    useEditorVim({
      editorInstance,
      editorRef,
      vimInstanceRef,
      statusBarRef,
      vimMode,
      displayLineMotion,
    })
    useEditorSpellCheck({
      editorRef,
      monacoRef,
      spellCheck,
      vimMode,
      onSpellCheckChange,
      editorInstance,
    })
    useEditorHandle({ ref, editorRef, pendingScrollCallbacks })

    useEffect(() => {
      emojiPickerEnabledRef.current = emojiPickerEnabled
    }, [emojiPickerEnabled])

    useEffect(() => {
      emojiPickerStateRef.current = emojiPickerEnabled ? emojiPickerState : null
    }, [emojiPickerEnabled, emojiPickerState])

    useEffect(() => {
      filteredEmojiEntriesRef.current = filteredEmojiEntries
    }, [filteredEmojiEntries])

    useEffect(() => {
      selectedEmojiIndexRef.current = activeSelectedEmojiIndex
    }, [activeSelectedEmojiIndex])

    useEffect(() => {
      if (!emojiPickerState) return

      const handleClickOutside = (event: MouseEvent): void => {
        const target = event.target
        if (!(target instanceof Node)) return
        if (emojiPickerRef.current?.contains(target)) return
        if (editorContainerRef.current?.contains(target)) return
        setEmojiPickerState(null)
        setSelectedEmojiIndex(0)
      }

      window.addEventListener('mousedown', handleClickOutside)
      return () => window.removeEventListener('mousedown', handleClickOutside)
    }, [emojiPickerState])

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
          <div ref={editorContainerRef} className="relative h-full">
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

            {emojiPickerEnabled && emojiPickerState && (
              <div
                ref={emojiPickerRef}
                className="absolute z-20 w-80 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
                style={{ top: emojiPickerState.top, left: emojiPickerState.left }}
                onMouseDown={(event) => event.preventDefault()}
              >
                {isEmojiLoading && (
                  <p className="px-2 py-2 text-xs text-muted-foreground">Loading emojis...</p>
                )}
                {!isEmojiLoading && emojiLoadError && (
                  <p className="px-2 py-2 text-xs text-destructive">{emojiLoadError}</p>
                )}
                {!isEmojiLoading && !emojiLoadError && (
                  <ScrollArea className="h-56">
                    <div className="space-y-1 pr-2">
                      {filteredEmojiEntries.length === 0 && (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          No emoji matches for :{emojiPickerState.query}
                        </p>
                      )}
                      {filteredEmojiEntries.map((entry, index) => (
                        <Button
                          key={entry.shortcode}
                          type="button"
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-2',
                            index === activeSelectedEmojiIndex && 'bg-accent text-foreground'
                          )}
                          aria-label={`Insert :${entry.shortcode}:`}
                          aria-selected={index === activeSelectedEmojiIndex}
                          onMouseEnter={() => setSelectedEmojiIndex(index)}
                          onClick={() => handleInsertEmojiShortcode(entry.shortcode)}
                        >
                          <span className="text-base leading-none">{entry.emoji}</span>
                          <span className="font-mono text-xs text-foreground">
                            :{entry.shortcode}:
                          </span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

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
