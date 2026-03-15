import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { editor } from 'monaco-editor'
import type { VimMode as VimAdapter } from 'monaco-vim'
import { useEditorVim } from './useEditorVim'

const { mockHandleKey } = vi.hoisted(() => ({
  mockHandleKey: vi.fn(),
}))

vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
  VimMode: {
    Vim: {
      handleKey: mockHandleKey,
    },
  },
}))

vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}))

vi.mock('../vim', () => ({
  setupVim: vi.fn(),
  setVimDisplayLineOption: vi.fn(),
}))

vi.mock('../vimDisplayLine', () => ({
  clearDisplayLineEnabledForEditor: vi.fn(),
}))

interface MockEditor {
  editor: editor.IStandaloneCodeEditor
  triggerMouseDown: (event: {
    leftButton: boolean
    position?: { lineNumber: number; column: number }
  }) => void
  triggerMouseUp: (event: { position?: { lineNumber: number; column: number } }) => void
  setPosition: ReturnType<typeof vi.fn>
  setSelection: ReturnType<typeof vi.fn>
}

const createDisposable = (): { dispose: ReturnType<typeof vi.fn> } => ({
  dispose: vi.fn(),
})

const createEditorMock = (): MockEditor => {
  let mouseDownHandler:
    | ((event: {
        event: { leftButton: boolean }
        target: { position?: { lineNumber: number; column: number } }
      }) => void)
    | null = null
  let mouseUpHandler:
    | ((event: { target: { position?: { lineNumber: number; column: number } } }) => void)
    | null = null

  const setPosition = vi.fn()
  const setSelection = vi.fn()

  const editorMock = {
    deltaDecorations: vi.fn(() => []),
    getDomNode: vi.fn(() => document.createElement('div')),
    getModel: vi.fn(() => null),
    onDidChangeCursorSelection: vi.fn(() => createDisposable()),
    onDidChangeModel: vi.fn(() => createDisposable()),
    onMouseDown: vi.fn((handler) => {
      mouseDownHandler = handler
      return createDisposable()
    }),
    onMouseUp: vi.fn((handler) => {
      mouseUpHandler = handler
      return createDisposable()
    }),
    setPosition,
    setSelection,
  } as unknown as editor.IStandaloneCodeEditor

  return {
    editor: editorMock,
    setPosition,
    setSelection,
    triggerMouseDown: ({ leftButton, position }) => {
      mouseDownHandler?.({
        event: { leftButton },
        target: position ? { position } : {},
      })
    },
    triggerMouseUp: ({ position }) => {
      mouseUpHandler?.({
        target: position ? { position } : {},
      })
    },
  }
}

const createVimInstance = (visualMode: boolean): VimAdapter =>
  ({
    dispose: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    state: {
      vim: {
        visualMode,
      },
    },
  }) as unknown as VimAdapter

describe('useEditorVim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exits visual mode when clicking to move the cursor', () => {
    const { editor, triggerMouseDown, triggerMouseUp, setPosition, setSelection } =
      createEditorMock()
    const vimInstance = createVimInstance(true)

    renderHook(() =>
      useEditorVim({
        editorInstance: editor,
        editorRef: { current: editor },
        vimInstanceRef: { current: vimInstance },
        statusBarRef: { current: document.createElement('div') },
        vimMode: true,
      })
    )

    act(() => {
      triggerMouseDown({
        leftButton: true,
        position: { lineNumber: 3, column: 7 },
      })
      triggerMouseUp({
        position: { lineNumber: 3, column: 7 },
      })
    })

    expect(mockHandleKey).toHaveBeenCalledWith(vimInstance, '<Esc>')
    expect(setPosition).toHaveBeenCalledWith({ lineNumber: 3, column: 7 })
    expect(setSelection).toHaveBeenCalledOnce()
  })

  it('ignores clicks when visual mode is already inactive', () => {
    const { editor, triggerMouseDown, triggerMouseUp, setPosition, setSelection } =
      createEditorMock()
    const vimInstance = createVimInstance(false)

    renderHook(() =>
      useEditorVim({
        editorInstance: editor,
        editorRef: { current: editor },
        vimInstanceRef: { current: vimInstance },
        statusBarRef: { current: document.createElement('div') },
        vimMode: true,
      })
    )

    act(() => {
      triggerMouseDown({
        leftButton: true,
        position: { lineNumber: 1, column: 1 },
      })
      triggerMouseUp({
        position: { lineNumber: 1, column: 1 },
      })
    })

    expect(mockHandleKey).not.toHaveBeenCalled()
    expect(setPosition).not.toHaveBeenCalled()
    expect(setSelection).not.toHaveBeenCalled()
  })
})
