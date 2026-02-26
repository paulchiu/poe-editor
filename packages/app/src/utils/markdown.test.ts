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
