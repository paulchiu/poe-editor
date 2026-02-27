import { describe, it, expect } from 'vitest'
import { renderMarkdown, getFirstHeading } from './markdown'

describe('renderMarkdown', () => {
  it('should render basic markdown', () => {
    const markdown = '# Hello\n\n**Bold** and *Italic*'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<strong>Bold</strong>')
    expect(html).toContain('<em>Italic</em>')
  })

  it('should render code blocks with highlighting classes', () => {
    const markdown = '```js\nconsole.log("hi")\n```'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<div class="code-block-with-language" data-language="js">')
    expect(html).toContain('<div class="code-block-language-hint">JavaScript</div>')
    expect(html).toContain('<pre><code class="hljs language-js">')
    expect(html).toContain('console')
    expect(html).toContain('log')
  })

  it('should map ts shorthand to a TypeScript label', () => {
    const markdown = '```ts\nconst value: string = "x"\n```'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<div class="code-block-language-hint">TypeScript</div>')
    expect(html).toContain('class="hljs language-ts"')
  })

  it('should render mermaid code blocks as standard code blocks', () => {
    const markdown = '```mermaid\ngraph TD;\n    A-->B;\n```'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<div class="code-block-language-hint">Mermaid</div>')
    expect(html).toContain('data-raw-code="graph TD;\n    A-->B;"')
    expect(html).toContain('<pre><code class="hljs language-mermaid">')
    expect(html).toContain('graph TD;')
  })

  it('should not render language hint when code block has no language', () => {
    const markdown = '```\nplain text\n```'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<pre><code class="hljs">')
    expect(html).not.toContain('code-block-language-hint')
  })

  it('should handle empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('should render links', () => {
    const markdown = '[link](https://example.com)'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<a href="https://example.com">link</a>')
  })

  it('should render supported safe html tags in markdown', () => {
    const markdown = '<details><summary>More</summary><kbd>Cmd</kbd> + <kbd>K</kbd></details>'
    const html = renderMarkdown(markdown)

    expect(html).toContain('<details>')
    expect(html).toContain('<summary>More</summary>')
    expect(html).toContain('<kbd>Cmd</kbd>')
    expect(html).toContain('<kbd>K</kbd>')
  })

  it('should sanitize unsafe raw html in markdown', () => {
    const markdown = '<script>alert(1)</script><a href="javascript:alert(2)">link</a>'
    const html = renderMarkdown(markdown)

    expect(html).not.toContain('<script>')
    expect(html).toContain('<a>link</a>')
    expect(html).not.toContain('javascript:')
  })

  it('should render NOTE blockquotes as GitHub callouts', () => {
    const markdown = '> [!NOTE]\n> This is useful context.'
    const html = renderMarkdown(markdown)

    expect(html).toContain('<blockquote class="markdown-alert markdown-alert-note">')
    expect(html).toContain('<p class="markdown-alert-title">Note</p>')
    expect(html).toContain('<p>This is useful context.</p>')
    expect(html).not.toContain('[!NOTE]')
  })

  it('should support all GitHub callout markers', () => {
    const markdown =
      '> [!TIP]\n> Tip body.\n\n> [!IMPORTANT]\n> Important body.\n\n> [!WARNING]\n> Warning body.\n\n> [!CAUTION]\n> Caution body.'
    const html = renderMarkdown(markdown)

    expect(html).toContain('class="markdown-alert markdown-alert-tip"')
    expect(html).toContain('class="markdown-alert markdown-alert-important"')
    expect(html).toContain('class="markdown-alert markdown-alert-warning"')
    expect(html).toContain('class="markdown-alert markdown-alert-caution"')
  })

  it('should keep unsupported callout markers as normal blockquotes', () => {
    const markdown = '> [!INFO]\n> Informational body.'
    const html = renderMarkdown(markdown)

    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('markdown-alert')
    expect(html).toContain('[!INFO]')
  })
})

describe('getFirstHeading', () => {
  it('should extract h1', () => {
    expect(getFirstHeading('# Hello World')).toBe('Hello World')
  })

  it('should extract h2', () => {
    expect(getFirstHeading('## Subheading')).toBe('Subheading')
  })

  it('should ignore text before heading', () => {
    expect(getFirstHeading('Some text\n# Title')).toBe('Title')
  })

  it('should ignore hashes in code blocks', () => {
    const md = '```\n# Not a heading\n```\n# Real Heading'
    expect(getFirstHeading(md)).toBe('Real Heading')
  })

  it('should return null if no heading', () => {
    expect(getFirstHeading('Just some text')).toBeNull()
  })

  it('should handle empty input', () => {
    expect(getFirstHeading('')).toBeNull()
  })
})
