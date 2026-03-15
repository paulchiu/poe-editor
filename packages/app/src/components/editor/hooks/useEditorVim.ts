import { useEffect, useRef } from 'react'
import { Selection, type editor, type IPosition } from 'monaco-editor'
import { initVimMode, VimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { toast } from '@/hooks/useToast'
import type { CodeMirrorAdapter, VimModeModule } from '../vimTypes'
import { setVimDisplayLineOption, setupVim } from '../vim'
import { clearDisplayLineEnabledForEditor } from '../vimDisplayLine'

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
      visualMode?: boolean
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

const resolveVimApi = (): VimModeModule['Vim'] | null => {
  if (!VimMode) {
    return null
  }

  const { Vim } = VimMode as unknown as VimModeModule
  return Vim || null
}

const toCodeMirrorAdapter = (vim: VimAdapter): CodeMirrorAdapter =>
  vim as unknown as CodeMirrorAdapter

const exitVisualModeOnMouseDown = (vim: VimAdapter): void => {
  const cm = toCodeMirrorAdapter(vim)
  if (!cm.state.vim.visualMode) {
    return
  }

  resolveVimApi()?.handleKey(cm, '<Esc>')
}

const attachVisualCursorSync = (
  editor: editor.IStandaloneCodeEditor,
  vim: VimAdapter
): (() => void) => {
  let decorationIds: string[] = []
  let isVisualCharMode = false
  let pendingMouseExitPosition: IPosition | null = null
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

  const mouseDownDisposable = editor.onMouseDown((event) => {
    if (!event.event.leftButton || !event.target.position) {
      return
    }

    if (!toCodeMirrorAdapter(vim).state.vim.visualMode) {
      return
    }

    pendingMouseExitPosition = event.target.position
    exitVisualModeOnMouseDown(vim)
  })

  const mouseUpDisposable = editor.onMouseUp((event) => {
    if (!pendingMouseExitPosition) {
      return
    }

    const position = event.target.position ?? pendingMouseExitPosition
    pendingMouseExitPosition = null

    editor.setPosition(position)
    editor.setSelection(
      new Selection(position.lineNumber, position.column, position.lineNumber, position.column)
    )
  })

  return () => {
    vim.off('vim-mode-change', onModeChange)
    cursorSelectionDisposable.dispose()
    modelChangeDisposable.dispose()
    mouseDownDisposable.dispose()
    mouseUpDisposable.dispose()
    clearDecoration()
  }
}

interface UseEditorVimParams {
  editorInstance: editor.IStandaloneCodeEditor | null
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  vimInstanceRef: React.MutableRefObject<VimAdapter | null>
  statusBarRef: React.RefObject<HTMLDivElement | null>
  vimMode?: boolean
  displayLineMotion?: boolean
}

/**
 * Manages the Vim mode lifecycle for the Monaco editor.
 * Initializes and disposes vim mode based on the vimMode prop.
 *
 * @param params - Editor ref, vim instance ref, status bar ref, and vimMode flag
 * @returns void
 */
export function useEditorVim({
  editorInstance,
  editorRef,
  vimInstanceRef,
  statusBarRef,
  vimMode,
  displayLineMotion = false,
}: UseEditorVimParams): void {
  const visualCursorCleanupRef = useRef<(() => void) | null>(null)
  const visualCursorEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!vimMode) {
      visualCursorCleanupRef.current?.()
      visualCursorCleanupRef.current = null
      visualCursorEditorRef.current = null

      if (vimInstanceRef.current) {
        const activeEditor = editorInstance ?? editorRef.current
        if (activeEditor) {
          clearDisplayLineEnabledForEditor(activeEditor)
        }
        vimInstanceRef.current.dispose()
        vimInstanceRef.current = null
      }
      return
    }

    const ed = editorInstance ?? editorRef.current
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
      setVimDisplayLineOption(toCodeMirrorAdapter(vimInstanceRef.current), displayLineMotion)
      if (!visualCursorCleanupRef.current) {
        visualCursorCleanupRef.current = attachVisualCursorSync(ed, vimInstanceRef.current)
        visualCursorEditorRef.current = ed
      }
      return
    }

    const timer = setTimeout(() => {
      const currentEditor = editorInstance ?? editorRef.current
      const currentStatusBar = statusBarRef.current

      if (currentEditor && currentStatusBar && !vimInstanceRef.current) {
        try {
          setupVim()
          vimInstanceRef.current = initVimMode(currentEditor, currentStatusBar)
          setVimDisplayLineOption(toCodeMirrorAdapter(vimInstanceRef.current), displayLineMotion)
          visualCursorCleanupRef.current = attachVisualCursorSync(
            currentEditor,
            vimInstanceRef.current
          )
          visualCursorEditorRef.current = currentEditor
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
  }, [vimMode, editorInstance, editorRef, vimInstanceRef, statusBarRef, displayLineMotion])

  useEffect(
    () => () => {
      visualCursorCleanupRef.current?.()
      visualCursorCleanupRef.current = null
      visualCursorEditorRef.current = null
      if (vimInstanceRef.current) {
        const activeEditor = editorInstance ?? editorRef.current
        if (activeEditor) {
          clearDisplayLineEnabledForEditor(activeEditor)
        }
        vimInstanceRef.current.dispose()
        vimInstanceRef.current = null
      }
    },
    [editorInstance, editorRef, vimInstanceRef]
  )
}
