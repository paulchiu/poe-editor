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

    const copyButton = screen.getByRole('button', { name: 'Copy rich text' })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('Test content', htmlContent)
      expect(toast).toHaveBeenCalledWith({ description: 'Rich text copied to clipboard' })
    })
  })

  it('shows error toast when copy fails', async () => {
    vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Failed'))
    render(<PreviewPane htmlContent={htmlContent} />)

    const copyButton = screen.getByRole('button', { name: 'Copy rich text' })
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

    const { container } = render(
      <PreviewPane
        htmlContent={renderedHtml}
        printFriendly
        onDecreasePreviewFontSize={vi.fn()}
        onIncreasePreviewFontSize={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(container.querySelector('.preview-code-copy-button')).toBeNull()
      expect(container.querySelector('.preview-mermaid-copy-controls')).toBeNull()
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders preview font-size controls and applies the current font size', () => {
    const onDecreasePreviewFontSize = vi.fn()
    const onIncreasePreviewFontSize = vi.fn()

    render(
      <PreviewPane
        htmlContent={htmlContent}
        previewFontSizePercent={120}
        onDecreasePreviewFontSize={onDecreasePreviewFontSize}
        onIncreasePreviewFontSize={onIncreasePreviewFontSize}
      />
    )

    const previewBody = screen.getByText('Test content').closest('.markdown-body')
    /** Assert the inline value, not computed style, which jsdom resolves rem to px. */
    expect((previewBody as HTMLElement).style.fontSize).toBe('1.2rem')

    fireEvent.click(screen.getByRole('button', { name: 'Decrease preview font size' }))
    fireEvent.click(screen.getByRole('button', { name: 'Increase preview font size' }))

    expect(onDecreasePreviewFontSize).toHaveBeenCalledTimes(1)
    expect(onIncreasePreviewFontSize).toHaveBeenCalledTimes(1)
  })

  it('disables preview font-size controls at bounds', () => {
    render(
      <PreviewPane
        htmlContent={htmlContent}
        canDecreasePreviewFontSize={false}
        canIncreasePreviewFontSize={false}
        onDecreasePreviewFontSize={vi.fn()}
        onIncreasePreviewFontSize={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Decrease preview font size' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase preview font size' })).toBeDisabled()
  })

  it('uses pointer-event gated preview toolbar styles with touch visibility', () => {
    render(
      <PreviewPane
        htmlContent={htmlContent}
        onDecreasePreviewFontSize={vi.fn()}
        onIncreasePreviewFontSize={vi.fn()}
      />
    )

    const toolbar = screen.getByTestId('preview-action-toolbar')
    expect(toolbar).toHaveClass('preview-action-toolbar')
    expect(toolbar).not.toHaveClass('opacity-0')
    expect(toolbar).not.toHaveClass('pointer-events-none')

    const globalCss = readFileSync(resolve(process.cwd(), 'src/globals.css'), 'utf8')
    expect(globalCss).toContain('.preview-action-toolbar {\n  pointer-events: none;')
    expect(globalCss).toContain('.preview-action-toolbar:focus-within')
    expect(globalCss).toContain('@media (hover: none), (pointer: coarse)')
    expect(globalCss).toContain('pointer-events: auto;')
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

  it('ignores body-authored checkboxes spoofing the front matter boolean class', async () => {
    const spoofHtml =
      '<p>spoof</p><input type="checkbox" class="front-matter-boolean-input" data-front-matter-key="draft">'
    const onFrontMatterBooleanToggle = vi.fn()

    const { container } = render(
      <PreviewPane
        htmlContent={spoofHtml}
        onFrontMatterBooleanToggle={onFrontMatterBooleanToggle}
      />
    )

    const spoofedCheckbox = container.querySelector<HTMLInputElement>(
      'input.front-matter-boolean-input[data-front-matter-key="draft"]'
    )
    expect(spoofedCheckbox).toBeTruthy()

    fireEvent.click(spoofedCheckbox!)

    await waitFor(() => {
      expect(onFrontMatterBooleanToggle).not.toHaveBeenCalled()
    })
  })

  it('calls onFrontMatterBooleanToggle when a front matter boolean is clicked', async () => {
    const markdown = ['---', 'draft: false', 'published: true', '---', '# Body'].join('\n')
    const renderedHtml = renderMarkdown(markdown)
    const onFrontMatterBooleanToggle = vi.fn()

    const { container } = render(
      <PreviewPane
        htmlContent={renderedHtml}
        onFrontMatterBooleanToggle={onFrontMatterBooleanToggle}
      />
    )

    const draftCheckbox = container.querySelector<HTMLInputElement>(
      'input.front-matter-boolean-input[data-front-matter-key="draft"]'
    )
    const publishedCheckbox = container.querySelector<HTMLInputElement>(
      'input.front-matter-boolean-input[data-front-matter-key="published"]'
    )
    expect(draftCheckbox).toBeTruthy()
    expect(publishedCheckbox).toBeTruthy()

    fireEvent.click(draftCheckbox!)
    fireEvent.click(publishedCheckbox!)

    await waitFor(() => {
      expect(onFrontMatterBooleanToggle).toHaveBeenNthCalledWith(1, 'draft', true)
      expect(onFrontMatterBooleanToggle).toHaveBeenNthCalledWith(2, 'published', false)
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
