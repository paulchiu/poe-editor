import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditorPane } from './EditorPane'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from 'sonner'
import { initVimMode } from 'monaco-vim'

// Mock the utilities and sonner
vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onMount }: { onMount: (editor: unknown, monaco: unknown) => void }) => {
    // Simulate mount immediately
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
      },
      {
        KeyMod: { CtrlCmd: 2048, Shift: 1024 },
        KeyCode: { KeyB: 32, KeyI: 39, KeyK: 41, KeyE: 35, Enter: 13 },
      }
    )
    return <div data-testid="monaco-editor" />
  },
}))

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
      expect(toast.success).toHaveBeenCalledWith('Markdown copied to clipboard!')
    })
  })

  it('shows error toast when copy fails', async () => {
    vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Failed'))
    render(<EditorPane value={value} onChange={() => {}} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard')
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
