import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditorPane } from './EditorPane'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from 'sonner'

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
  default: () => <div data-testid="monaco-editor" />,
}))

// Mock monaco-vim
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
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
})
