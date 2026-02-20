import { useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditorPane } from './index'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from '@/hooks/useToast'
import { initVimMode } from 'monaco-vim'

// Mock the utilities and toast hook
vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}))

// Mock monaco-editor to obtain KeyMod/KeyCode without side effects
vi.mock('monaco-editor', () => ({
  KeyMod: { CtrlCmd: 2048, Shift: 1024 },
  KeyCode: { KeyB: 32, KeyI: 39, KeyK: 41, KeyE: 35, Enter: 13 },
  Range: vi.fn(),
  editor: {
    setTheme: vi.fn(),
    defineTheme: vi.fn(),
  },
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
  },
  Uri: {
    parse: vi.fn(),
  },
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
  return {
    default: function MonacoEditorMock({
      onMount,
    }: {
      onMount: (editor: unknown, monaco: unknown) => void
    }) {
      useEffect(() => {
        // Simulate mount asynchronously to avoid React state updates during render
        onMount(
          {
            getDomNode: () => document.createElement('div'),
            getScrollTop: () => 0,
            getScrollHeight: () => 100,
            getLayoutInfo: () => ({ height: 500 }),
            onDidScrollChange: vi.fn(),
            onDidChangeCursorPosition: vi.fn(),
            addCommand: vi.fn(),
            onKeyDown: vi.fn(),
            getPosition: vi.fn(),
            executeEdits: vi.fn(),
            setPosition: vi.fn(),
            focus: vi.fn(),
            createContextKey: vi.fn().mockReturnValue({
              set: vi.fn(),
              get: vi.fn(),
              reset: vi.fn(),
            }),
            getModel: vi.fn(),
            onDidChangeModelContent: vi.fn(),
          },
          {
            KeyMod: { CtrlCmd: 2048, Shift: 1024 },
            KeyCode: { KeyB: 32, KeyI: 39, KeyK: 41, KeyE: 35, Enter: 13 },
            editor: {
              setModelMarkers: vi.fn(),
            },
          }
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return <div data-testid="monaco-editor" />
    },
  }
})

// Mock monaco-vim
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  VimMode: { Vim: null },
}))

describe('EditorPane', () => {
  const value = '# Hello World'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders progress and editor', () => {
    render(<EditorPane value={value} onChange={() => {}} />)
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('calls copyToClipboard when copy button is clicked', async () => {
    render(<EditorPane value={value} onChange={() => {}} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(value)
      expect(toast).toHaveBeenCalledWith({ description: 'Markdown copied to clipboard' })
    })
  })

  it('shows error toast when copy fails', async () => {
    vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Failed'))
    render(<EditorPane value={value} onChange={() => {}} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    })
  })

  it('initializes vim mode when enabled', async () => {
    render(<EditorPane value={value} onChange={() => {}} vimMode={true} />)

    // Wait for the useEffect timeout
    await waitFor(() => {
      expect(initVimMode).toHaveBeenCalled()
    })
  })
})
