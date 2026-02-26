import { useEffect, useRef } from 'react'
import type { editor } from 'monaco-editor'
import { initVimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { toast } from '@/hooks/useToast'
import { setupVim } from '../vim'

const VISUAL_CURSOR_CLASS = 'vim-visual-head-cursor'
const VISUAL_CURSOR_ACTIVE_CLASS = 'vim-visual-char-active'

interface VimCursor {
  line: number
  ch: number
}

interface VimModeChangeEvent {
  mode: string
  subMode?: string
}

interface VimStateWithSelection {
  state?: {
    vim?: {
      sel?: {
        head?: VimCursor
      }
    }
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isVimCursor = (value: unknown): value is VimCursor => {
  if (!isObject(value)) {
    return false
  }
  return typeof value.line === 'number' && typeof value.ch === 'number'
}

const isVimModeChangeEvent = (value: unknown): value is VimModeChangeEvent => {
  if (!isObject(value)) {
    return false
  }
  if (typeof value.mode !== 'string') {
    return false
  }
  if (typeof value.subMode !== 'undefined' && typeof value.subMode !== 'string') {
    return false
  }
  return true
}

const getVisualHead = (vim: VimAdapter): VimCursor | null => {
  const maybeState = vim as unknown as VimStateWithSelection
  const head = maybeState.state?.vim?.sel?.head
  return isVimCursor(head) ? head : null
}

const attachVisualCursorSync = (
  editor: editor.IStandaloneCodeEditor,
  vim: VimAdapter
): (() => void) => {
  let decorationIds: string[] = []
  let isVisualCharMode = false
  const domNode = editor.getDomNode()

  const clearDecoration = (): void => {
    if (decorationIds.length > 0) {
      decorationIds = editor.deltaDecorations(decorationIds, [])
    }
    domNode?.classList.remove(VISUAL_CURSOR_ACTIVE_CLASS)
  }

  const applyDecoration = (): void => {
    if (!isVisualCharMode) {
      clearDecoration()
      return
    }

    const model = editor.getModel()
    const head = getVisualHead(vim)
    if (!model || !head) {
      clearDecoration()
      return
    }

    const lineNumber = head.line + 1
    if (lineNumber < 1 || lineNumber > model.getLineCount()) {
      clearDecoration()
      return
    }

    const maxColumn = model.getLineMaxColumn(lineNumber)
    // Empty lines cannot receive an inline one-character decoration.
    if (maxColumn <= 1) {
      clearDecoration()
      return
    }

    const startColumn = Math.min(Math.max(1, head.ch + 1), maxColumn - 1)
    const endColumn = startColumn + 1

    decorationIds = editor.deltaDecorations(decorationIds, [
      {
        range: {
          startLineNumber: lineNumber,
          startColumn,
          endLineNumber: lineNumber,
          endColumn,
        },
        options: {
          inlineClassName: VISUAL_CURSOR_CLASS,
        },
      },
    ])

    domNode?.classList.add(VISUAL_CURSOR_ACTIVE_CLASS)
  }

  const onModeChange = (event: unknown): void => {
    if (!isVimModeChangeEvent(event)) {
      isVisualCharMode = false
      clearDecoration()
      return
    }

    isVisualCharMode = event.mode === 'visual' && !event.subMode
    applyDecoration()
  }

  vim.on('vim-mode-change', onModeChange)

  const cursorSelectionDisposable = editor.onDidChangeCursorSelection(() => {
    if (isVisualCharMode) {
      applyDecoration()
    }
  })

  const modelChangeDisposable = editor.onDidChangeModel(() => {
    if (isVisualCharMode) {
      applyDecoration()
    }
  })

  return () => {
    vim.off('vim-mode-change', onModeChange)
    cursorSelectionDisposable.dispose()
    modelChangeDisposable.dispose()
    clearDecoration()
  }
}

interface UseEditorVimParams {
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  vimInstanceRef: React.MutableRefObject<VimAdapter | null>
  statusBarRef: React.RefObject<HTMLDivElement | null>
  vimMode?: boolean
}

/**
 * Manages the Vim mode lifecycle for the Monaco editor.
 * Initializes and disposes vim mode based on the vimMode prop.
 *
 * @param params - Editor ref, vim instance ref, status bar ref, and vimMode flag
 * @returns void
 */
export function useEditorVim({
  editorRef,
  vimInstanceRef,
  statusBarRef,
  vimMode,
}: UseEditorVimParams): void {
  const visualCursorCleanupRef = useRef<(() => void) | null>(null)
  const visualCursorEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!vimMode) {
      visualCursorCleanupRef.current?.()
      visualCursorCleanupRef.current = null
      visualCursorEditorRef.current = null

      if (vimInstanceRef.current) {
        vimInstanceRef.current.dispose()
        vimInstanceRef.current = null
      }
      return
    }

    const ed = editorRef.current
    const statusBar = statusBarRef.current

    if (!ed || !statusBar) {
      return
    }

    if (visualCursorEditorRef.current !== ed) {
      visualCursorCleanupRef.current?.()
      visualCursorCleanupRef.current = null
      visualCursorEditorRef.current = null
    }

    if (vimInstanceRef.current) {
      if (!visualCursorCleanupRef.current) {
        visualCursorCleanupRef.current = attachVisualCursorSync(ed, vimInstanceRef.current)
        visualCursorEditorRef.current = ed
      }
      return
    }

    const timer = setTimeout(() => {
      if (editorRef.current && statusBarRef.current && !vimInstanceRef.current) {
        try {
          setupVim()
          vimInstanceRef.current = initVimMode(editorRef.current, statusBarRef.current)
          visualCursorCleanupRef.current = attachVisualCursorSync(
            editorRef.current,
            vimInstanceRef.current
          )
          visualCursorEditorRef.current = editorRef.current
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
  }, [vimMode, editorRef, vimInstanceRef, statusBarRef])

  useEffect(
    () => () => {
      visualCursorCleanupRef.current?.()
      visualCursorCleanupRef.current = null
      visualCursorEditorRef.current = null
      if (vimInstanceRef.current) {
        vimInstanceRef.current.dispose()
        vimInstanceRef.current = null
      }
    },
    [vimInstanceRef]
  )
}
