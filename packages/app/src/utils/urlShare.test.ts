import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractSnippet,
  encodePathSegment,
  generateShareableUrl,
  parsePathMetadata,
} from './urlShare'

describe('extractSnippet', () => {
  it('extracts first non-heading line', () => {
    const content = `# Title\n\nThis is the snippet\n\nMore content`
    expect(extractSnippet(content)).toBe('This is the snippet')
  })

  it('removes markdown formatting', () => {
    const content = 'This is **bold** and *italic* and `code`'
    expect(extractSnippet(content)).toBe('This is bold and italic and code')
  })

  it('converts links to just text', () => {
    const content = 'Check out [this link](https://example.com) here'
    expect(extractSnippet(content)).toBe('Check out this link here')
  })

  it('removes images', () => {
    const content = 'Here is an ![image](test.png) and text'
    expect(extractSnippet(content)).toBe('Here is an  and text')
  })

  it('truncates long content', () => {
    const longText = 'a'.repeat(100)
    expect(extractSnippet(longText, 50)).toBe('a'.repeat(47) + '...')
  })

  it('skips empty lines', () => {
    const content = `\n\n\nActual content here`
    expect(extractSnippet(content)).toBe('Actual content here')
  })

  it('returns default message when no content found', () => {
    expect(extractSnippet('')).toBe('A document on poemd.dev')
    expect(extractSnippet('# Only headings\n# Another heading')).toBe('A document on poemd.dev')
  })
})

describe('encodePathSegment', () => {
  it('encodes spaces to dashes', () => {
    expect(encodePathSegment('hello world')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(encodePathSegment('hello!@#world')).toBe('helloworld')
  })

  it('collapses multiple dashes', () => {
    expect(encodePathSegment('hello---world')).toBe('hello-world')
  })

  it('lowercases text', () => {
    expect(encodePathSegment('Hello World')).toBe('hello-world')
  })

  it('trims whitespace', () => {
    expect(encodePathSegment('  hello world  ')).toBe('hello-world')
  })

  it('URL encodes result', () => {
    expect(encodePathSegment('hello world!')).toBe('hello-world')
  })
})

describe('generateShareableUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://poemd.dev' },
    })
  })

  it('generates URL with title from heading', () => {
    const content = `# My Great Title\n\nSome content here`
    const url = generateShareableUrl(content, 'untitled.md', 'abc123')
    expect(url).toContain('/my-great-title/')
    expect(url).toContain('#abc123')
  })

  it('removes emoji from title', () => {
    const content = `# 🎉 My Party Title\n\nSome content`
    const url = generateShareableUrl(content, 'untitled.md', 'hash123')
    expect(url).not.toContain('%F0%9F%8E%89') // emoji should be removed
    expect(url).toContain('/my-party-title/')
  })

  it('uses document name when no heading', () => {
    const content = 'Just some content without heading'
    const url = generateShareableUrl(content, 'my-doc.md', 'xyz789')
    expect(url).toContain('/my-doc/')
    expect(url).toContain('#xyz789')
  })

  it('includes snippet from content', () => {
    const content = `# Title\n\nThis is the snippet text`
    const url = generateShareableUrl(content, 'untitled.md', 'hash')
    expect(url).toContain('/this-is-the-snippet-text')
  })

  it('handles empty hash', () => {
    const content = '# Title\n\nSnippet'
    const url = generateShareableUrl(content, 'untitled.md', '')
    expect(url).not.toContain('#')
    expect(url).toBe('https://poemd.dev/title/snippet')
  })
})

describe('parsePathMetadata', () => {
  it('parses valid path with two segments', () => {
    const result = parsePathMetadata('/my-title/my-snippet')
    expect(result).toEqual({
      title: 'my title',
      snippet: 'my snippet',
    })
  })

  it('handles URL encoded segments', () => {
    const result = parsePathMetadata('/hello%20world/my%20snippet')
    expect(result).toEqual({
      title: 'hello world',
      snippet: 'my snippet',
    })
  })

  it('converts dashes to spaces', () => {
    const result = parsePathMetadata('/my-great-title/some-snippet-text')
    expect(result).toEqual({
      title: 'my great title',
      snippet: 'some snippet text',
    })
  })

  it('returns null for single segment', () => {
    expect(parsePathMetadata('/only-one')).toBeNull()
  })

  it('returns null for three segments', () => {
    expect(parsePathMetadata('/one/two/three')).toBeNull()
  })

  it('returns null for root path', () => {
    expect(parsePathMetadata('/')).toBeNull()
    expect(parsePathMetadata('')).toBeNull()
  })

  it('ignores empty segments', () => {
    const result = parsePathMetadata('//title//snippet//')
    expect(result).toEqual({
      title: 'title',
      snippet: 'snippet',
    })
  })
})
