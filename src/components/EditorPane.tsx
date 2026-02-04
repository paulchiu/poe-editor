import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { initVimMode, VimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { copyToClipboard } from '@/utils/clipboard'

// Setup clipboard integration for monaco-vim
// This needs to run only once to register the operators and actions globally
let vimClipboardSetup = false

interface VimRegisterController {
  pushText: (
    register: string,
    type: string,
    text: string,
    linewise: boolean,
    blockwise: boolean
  ) => void
}

interface VimState {
  vim: {
    visualBlock: boolean
  }
}

interface CodeMirrorAdapter {
  getSelection: () => string
  state: VimState
}

interface VimOperatorArgs {
  registerName: string
  linewise: boolean
  after?: boolean
}

interface VimAPI {
  defineOperator: (
    name: string,
    fn: (
      cm: CodeMirrorAdapter,
      args: VimOperatorArgs,
      ranges: unknown,
      oldAnchor: unknown
    ) => unknown
  ) => void
  defineAction: (
    name: string,
    fn: (cm: CodeMirrorAdapter, args: VimOperatorArgs) => Promise<void> | void
  ) => void
  getRegisterController: () => VimRegisterController
  handleKey: (cm: CodeMirrorAdapter, key: string) => void
  mapCommand: (
    command: string,
    type: 'action' | 'operator',
    name: string,
    args?: Record<string, unknown>,
    extra?: Record<string, unknown>
  ) => void
}

interface VimModeModule {
  Vim: VimAPI
}

function setupVimClipboard() {
  if (vimClipboardSetup || !VimMode) {
    return
  }
  vimClipboardSetup = true

  // VimMode is the CMAdapter class, and 'Vim' API is attached to it at runtime
  const { Vim } = VimMode as unknown as VimModeModule

  if (!Vim) {
    return
  }

  // Define yank to system clipboard operator
  Vim.defineOperator(
    'yankSystem',
    (cm: CodeMirrorAdapter, args: VimOperatorArgs, _ranges: unknown, oldAnchor: unknown) => {
      const text = cm.getSelection()
      if (text) {
        navigator.clipboard.writeText(text).catch((e) => {
          console.error('Failed to write to clipboard', e)
          toast.error('Failed to write to system clipboard')
        })

        // Update internal register for consistency so 'p' works internally
        Vim.getRegisterController().pushText(
          args.registerName,
          'yank',
          text,
          args.linewise,
          cm.state.vim.visualBlock
        )
      }
      return oldAnchor
    }
  )

  // Define paste from system clipboard action
  Vim.defineAction('pasteSystem', async (cm: CodeMirrorAdapter, args: VimOperatorArgs) => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const linewise = text.indexOf('\n') !== -1 && (text.endsWith('\n') || text.endsWith('\r\n'))

        // Push to " register
        Vim.getRegisterController().pushText('"', 'yank', text, linewise, false)

        // Trigger the internal paste action using a mapped key
        if (args.after) {
          Vim.handleKey(cm, '<PasteTrigger>')
        } else {
          Vim.handleKey(cm, '<PasteTriggerBefore>')
        }
      }
    } catch (e) {
      console.error('Clipboard read failed:', e)
      toast.error('Failed to read from system clipboard')
    }
  })

  // Register the internal paste command to a custom key
  Vim.mapCommand('<PasteTrigger>', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('<PasteTriggerBefore>', 'action', 'paste', { after: false, isEdit: true })

  // Remap y to yankSystem operator
  Vim.mapCommand('y', 'operator', 'yankSystem')
  // Remap Y to yankSystem (linewise)
  Vim.mapCommand(
    'Y',
    'operator',
    'yankSystem',
    { linewise: true },
    { type: 'operatorMotion', motion: 'expandToLine', motionArgs: { linewise: true } }
  )

  // Explicitly map p/P back to default 'paste' to ensure no stale 'pasteSystem' mapping remains
  // This fixes the popup issue by avoiding navigator.clipboard.readText() on 'p'
  Vim.mapCommand('p', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('P', 'action', 'paste', { after: false, isEdit: true })
}

// Run setup immediately
setupVimClipboard()

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  onCursorChange?: (position: { lineNumber: number; column: number }) => void
  theme?: 'light' | 'dark'
  onFormat?: (type: 'bold' | 'italic' | 'link' | 'code') => void
  onCodeBlock?: () => void
  vimMode?: boolean
  scrollRef?: React.RefObject<HTMLElement | null>
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
    { value, onChange, onCursorChange, theme = 'light', onFormat, onCodeBlock, vimMode, scrollRef },
    ref
  ) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const vimInstanceRef = useRef<VimAdapter | null>(null)
    const statusBarRef = useRef<HTMLDivElement | null>(null)
    const [copied, setCopied] = useState(false)

    const handleEditorDidMount: OnMount = (editor, monaco): void => {
      editorRef.current = editor

      // Capture scroll element for sync scroll
      if (scrollRef) {
        const domNode = editor.getDomNode()
        if (domNode) {
          const scrollable = domNode.querySelector('.monaco-scrollable-element') as HTMLElement
          if (scrollable) {
            // We need to use a type assertion or just set current directly if it's a mutable ref object
            // eslint-disable-next-line
            ;(scrollRef as React.MutableRefObject<HTMLElement | null>).current = scrollable

            // Override scroll properties to use Monaco's internal state
            // since the DOM element uses virtual scrolling/transform
            Object.defineProperty(scrollable, 'scrollTop', {
              get: () => editor.getScrollTop(),
              configurable: true,
            })
            Object.defineProperty(scrollable, 'scrollHeight', {
              get: () => editor.getScrollHeight(),
              configurable: true,
            })
            Object.defineProperty(scrollable, 'clientHeight', {
              get: () => editor.getLayoutInfo().height,
              configurable: true,
            })

            // Bridge Monaco scroll event to native scroll event for useSyncScroll
            editor.onDidScrollChange(() => {
              scrollable.dispatchEvent(new Event('scroll'))
            })
          }
        }
      }

      // Initialize vim mode immediately after editor mounts if vimMode is enabled
      if (vimMode) {
        vimInstanceRef.current = initVimMode(editor, statusBarRef.current)
      }

      // Listen for cursor position changes
      if (onCursorChange) {
        editor.onDidChangeCursorPosition((e) => {
          onCursorChange({
            lineNumber: e.position.lineNumber,
            column: e.position.column,
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

      if (onCodeBlock) {
        // Cmd+Shift+K for code block (override Monaco's delete line)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
          onCodeBlock()
        })
      }
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
            toast.error('Error initializing vim mode')
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
        toast.success('Markdown copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Failed to copy to clipboard')
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
    }))

    return (
      <div className="relative h-full group bg-background flex flex-col overflow-hidden rounded-lg border border-border">
        <div className="flex-1 min-h-0">
          <div className="relative h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  className="absolute top-4 right-4 z-10 h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Copy markdown</p>
              </TooltipContent>
            </Tooltip>
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
                lineNumbers: 'on',
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
              }}
            />
          </div>
        </div>
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
