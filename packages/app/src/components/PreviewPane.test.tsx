import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PreviewPane } from './PreviewPane'
import { copyToClipboard } from '@/utils/clipboard'
import { toast } from '@/hooks/useToast'
import { renderMarkdown } from '@/utils/markdown'

const CLIPBOARD_FAILURE_HINT =
  'Copy failed. Clipboard access may be blocked by your browser permissions.'

const setPreviewScrollMetrics = (
  previewDocument: HTMLElement,
  {
    scrollHeight,
    clientHeight,
    scrollTop,
  }: {
    scrollHeight: number
    clientHeight: number
    scrollTop: number
  }
): void => {
  Object.defineProperties(previewDocument, {
    scrollHeight: {
      configurable: true,
      value: scrollHeight,
    },
    clientHeight: {
      configurable: true,
      value: clientHeight,
    },
    scrollTop: {
      configurable: true,
      value: scrollTop,
      writable: true,
    },
  })
}

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
        description: CLIPBOARD_FAILURE_HINT,
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
      expect(screen.getAllByRole('button', { name: 'Copy code block' })).toHaveLength(10)
    })

    rerender(<PreviewPane htmlContent={renderedHtml} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Copy code block' })).toHaveLength(10)
    })
  })

  it('skips interactive controls in print-friendly mode', async () => {
    const markdown = '```js\nconsole.log("print mode")\n```'
    const renderedHtml = renderMarkdown(markdown)

    const { container } = render(<PreviewPane htmlContent={renderedHtml} printFriendly />)

    await waitFor(() => {
      expect(container.querySelector('.preview-code-copy-button')).toBeNull()
      expect(container.querySelector('.preview-mermaid-copy-controls')).toBeNull()
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('reveals a jump-to-top control after scrolling a long preview document', async () => {
    render(<PreviewPane htmlContent={htmlContent} />)

    const previewDocument = screen.getByRole('region', { name: 'Preview document' })
    setPreviewScrollMetrics(previewDocument, {
      scrollHeight: 1_200,
      clientHeight: 500,
      scrollTop: 360,
    })
    fireEvent.scroll(previewDocument)

    const jumpToTopButton = await screen.findByRole('button', {
      name: 'Jump to top of preview',
    })
    const scrollToMock = vi.fn()
    Object.defineProperty(previewDocument, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    })

    fireEvent.click(jumpToTopButton)

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Jump to top of preview' })
      ).not.toBeInTheDocument()
    })
  })

  it('keeps the jump-to-top control hidden for short preview documents', () => {
    render(<PreviewPane htmlContent={htmlContent} />)

    const previewDocument = screen.getByRole('region', { name: 'Preview document' })
    setPreviewScrollMetrics(previewDocument, {
      scrollHeight: 480,
      clientHeight: 500,
      scrollTop: 360,
    })
    fireEvent.scroll(previewDocument)

    expect(screen.queryByRole('button', { name: 'Jump to top of preview' })).not.toBeInTheDocument()
  })

  it('calls onTaskListToggle when task checkbox is clicked', async () => {
    const markdown = '- [ ] first task\n- [x] done task'
    const renderedHtml = renderMarkdown(markdown)
    const onTaskListToggle = vi.fn()

    const { container } = render(
      <PreviewPane htmlContent={renderedHtml} onTaskListToggle={onTaskListToggle} />
    )

    const firstCheckbox = container.querySelector<HTMLInputElement>(
      'input.task-list-item-checkbox[data-task-index="0"]'
    )
    expect(firstCheckbox).toBeTruthy()

    fireEvent.click(firstCheckbox!)

    await waitFor(() => {
      expect(onTaskListToggle).toHaveBeenCalledWith(0, true)
    })
  })

  it('handles footnote hash links without mutating URL storage hash', () => {
    const markdown = 'Alpha[^1]\n\n[^1]: Footnote content.'
    const renderedHtml = renderMarkdown(markdown)
    window.location.hash = 'compressed-doc-hash'

    const originalScrollIntoView = Element.prototype.scrollIntoView
    const scrollIntoViewMock = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    })
    const { container } = render(<PreviewPane htmlContent={renderedHtml} />)

    const footnoteReference = container.querySelector<HTMLAnchorElement>(
      'sup.footnote-ref a[href="#fn1"]'
    )
    expect(footnoteReference).toBeTruthy()

    fireEvent.click(footnoteReference!)

    expect(window.location.hash).toBe('#compressed-doc-hash')
    expect(scrollIntoViewMock).toHaveBeenCalled()

    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: originalScrollIntoView,
    })
  })
})
