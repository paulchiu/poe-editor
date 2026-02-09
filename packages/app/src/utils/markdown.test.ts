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
