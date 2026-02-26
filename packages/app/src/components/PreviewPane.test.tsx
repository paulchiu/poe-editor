import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PreviewPane } from './PreviewPane'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from '@/hooks/useToast'
import { renderMarkdown } from '@/utils/markdown'

// Mock the utilities and toast hook
vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
  stripHtml: vi.fn((html) => html.replace(/<[^>]*>?/gm, '')),
}))

vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
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
      expect(toast).toHaveBeenCalledWith({ description: 'Rich text copied to clipboard' })
    })
  })

  it('shows error toast when copy fails', async () => {
    vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Failed'))
    render(<PreviewPane htmlContent={htmlContent} />)

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    })
  })

  it('copies fenced code block source from preview', async () => {
    const codeBlockHtml =
      '<div class="code-block-with-language" data-language="ts"><div class="code-block-language-hint">TypeScript</div><pre><code class="hljs language-ts">const value = 1\nconsole.log(value)</code></pre></div>'

    render(<PreviewPane htmlContent={codeBlockHtml} />)

    const codeCopyButton = await screen.findByRole('button', { name: 'Copy code block' })
    fireEvent.click(codeCopyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('const value = 1\nconsole.log(value)')
      expect(toast).toHaveBeenCalledWith({ description: 'Code copied to clipboard' })
    })
  })

  it('adds copy button for markdown-rendered fenced code blocks', async () => {
    const markdown = '```js\nconsole.log("hi")\n```'
    const renderedHtml = renderMarkdown(markdown)

    render(<PreviewPane htmlContent={renderedHtml} />)

    const codeCopyButton = await screen.findByRole('button', { name: 'Copy code block' })
    fireEvent.click(codeCopyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('console.log("hi")')
      expect(toast).toHaveBeenCalledWith({ description: 'Code copied to clipboard' })
    })
  })

  it('renders copy buttons for all non-mermaid fences in MD_TEST', async () => {
    const markdown = readFileSync(resolve(process.cwd(), 'MD_TEST.md'), 'utf8')
    const normalizedMarkdown = markdown.replace('```custom-lang_name', '```text')
    const renderedHtml = renderMarkdown(normalizedMarkdown)

    const { rerender } = render(<PreviewPane htmlContent={renderedHtml} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Copy code block' })).toHaveLength(8)
    })

    rerender(<PreviewPane htmlContent={renderedHtml} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Copy code block' })).toHaveLength(8)
    })
  })
})
