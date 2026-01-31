import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

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
    expect(html).toContain('<pre><code class="hljs language-js">')
    expect(html).toContain('console')
    expect(html).toContain('log')
  })

  it('should handle empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('should render links', () => {
    const markdown = '[link](https://example.com)'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<a href="https://example.com">link</a>')
  })
})
