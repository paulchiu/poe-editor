import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PreviewPane } from './PreviewPane'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from 'sonner'

// Mock the utilities and sonner
vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
  stripHtml: vi.fn((html) => html.replace(/<[^>]*>?/gm, '')),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('PreviewPane', () => {
  const htmlContent = '<h1>Test content</h1>'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders html content', () => {
    render(<PreviewPane htmlContent={htmlContent} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('calls copyToClipboard when copy button is clicked', async () => {
    render(<PreviewPane htmlContent={htmlContent} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('Test content', htmlContent)
      expect(toast.success).toHaveBeenCalledWith('Rich text copied to clipboard!')
    })
  })

  it('shows error toast when copy fails', async () => {
    vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Failed'))
    render(<PreviewPane htmlContent={htmlContent} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard')
    })
  })
})
