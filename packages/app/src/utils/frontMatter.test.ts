import { describe, expect, it } from 'vitest'
import {
  extractFrontMatter,
  getMarkdownBody,
  renderFrontMatterHtml,
  toggleFrontMatterBoolean,
} from './frontMatter'

describe('extractFrontMatter', () => {
  it('extracts object front matter and body', () => {
    const result = extractFrontMatter(
      ['---', 'title: Test note', 'tags:', '  - markdown', 'draft: false', '---', '# Body'].join(
        '\n'
      )
    )

    expect(result?.body).toBe('# Body')
    expect(result?.frontMatter.properties).toEqual([
      { key: 'title', value: { type: 'text', value: 'Test note' } },
      { key: 'tags', value: { type: 'list', items: ['markdown'], isTagList: true } },
      { key: 'draft', value: { type: 'boolean', value: false } },
    ])
  })

  it('handles BOM, CRLF, and trailing delimiter whitespace', () => {
    const result = extractFrontMatter('\uFEFF---   \r\ntitle: CRLF\r\n---   \r\n# Title')

    expect(result?.body).toBe('# Title')
    expect(result?.sourcePrefix).toBe('\uFEFF---   \r\ntitle: CRLF\r\n---   \r\n')
  })

  it('supports a closing ellipsis delimiter', () => {
    const result = extractFrontMatter('---\ntitle: Ellipsis\n...\n# Title')

    expect(result?.body).toBe('# Title')
    expect(result?.frontMatter.properties[0]?.key).toBe('title')
  })

  it('strips valid empty and non-object front matter without rendering properties', () => {
    expect(extractFrontMatter('---\n---\n# Title')?.frontMatter.properties).toEqual([])
    expect(extractFrontMatter('---\n[]\n---\n# Title')?.frontMatter.properties).toEqual([])
    expect(extractFrontMatter('---\nhello\n---\n# Title')?.frontMatter.properties).toEqual([])
    expect(getMarkdownBody('---\nhello\n---\n# Title')).toBe('# Title')
  })

  it('returns null for missing, malformed, oversized, or deeply nested front matter', () => {
    expect(extractFrontMatter('# Title')).toBeNull()
    expect(extractFrontMatter('---\ntitle: Missing close')).toBeNull()
    expect(extractFrontMatter('---\nkey: [unterminated\n---\n# Title')).toBeNull()
    expect(extractFrontMatter(`---\ntitle: ${'x'.repeat(17_000)}\n---\n# Title`)).toBeNull()
    expect(
      extractFrontMatter('---\na:\n  b:\n    c:\n      d:\n        e: too deep\n---\n# Title')
    ).toBeNull()
  })

  it('returns null for cyclic or repeated aliases', () => {
    expect(extractFrontMatter('---\ncycle: &a [*a]\n---\n# Title')).toBeNull()
    expect(
      extractFrontMatter('---\none: &shared\n  value: 1\ntwo: *shared\n---\n# Title')
    ).toBeNull()
  })
})

describe('renderFrontMatterHtml', () => {
  it('renders escaped property rows and value variants', () => {
    const result = extractFrontMatter(
      [
        '---',
        'title: "<script>alert(1)</script>"',
        'tags: [poe, markdown]',
        'draft: true',
        'count: 3',
        'empty:',
        'nested:',
        '  one: two',
        '---',
        '# Body',
      ].join('\n')
    )

    const html = renderFrontMatterHtml(result!.frontMatter)

    expect(html).toContain('class="front-matter-properties"')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('front-matter-tag')
    expect(html).toContain('checked=""')
    expect(html).toContain('>3<')
    expect(html).toContain('front-matter-empty')
    expect(html).toContain('{&quot;one&quot;:&quot;two&quot;}')
    expect(html).not.toContain('<script>')
  })

  it('returns an empty string for empty properties', () => {
    expect(renderFrontMatterHtml({ properties: [] })).toBe('')
  })

  it('renders boolean checkboxes with the front matter key for click handlers', () => {
    const result = extractFrontMatter('---\ndraft: false\npublished: true\n---\n# Body')
    const html = renderFrontMatterHtml(result!.frontMatter)

    expect(html).toContain('class="front-matter-boolean-input"')
    expect(html).toContain('data-front-matter-key="draft"')
    expect(html).toContain('data-front-matter-key="published"')
    expect(html).not.toContain('disabled=""')
  })
})

describe('toggleFrontMatterBoolean', () => {
  it('flips a top-level boolean from false to true', () => {
    const input = '---\ntitle: Doc\ndraft: false\n---\n# Body'
    expect(toggleFrontMatterBoolean(input, 'draft', true)).toBe(
      '---\ntitle: Doc\ndraft: true\n---\n# Body'
    )
  })

  it('flips a top-level boolean from true to false', () => {
    const input = '---\npublished: true\n---\n# Body'
    expect(toggleFrontMatterBoolean(input, 'published', false)).toBe(
      '---\npublished: false\n---\n# Body'
    )
  })

  it('preserves casing for True/False and TRUE/FALSE literals', () => {
    expect(toggleFrontMatterBoolean('---\nready: True\n---\n# Body', 'ready', false)).toBe(
      '---\nready: False\n---\n# Body'
    )
    expect(toggleFrontMatterBoolean('---\nready: FALSE\n---\n# Body', 'ready', true)).toBe(
      '---\nready: TRUE\n---\n# Body'
    )
  })

  it('preserves trailing comments and inline whitespace', () => {
    const input = '---\ndraft:   true  # initial draft\n---\n# Body'
    expect(toggleFrontMatterBoolean(input, 'draft', false)).toBe(
      '---\ndraft:   false  # initial draft\n---\n# Body'
    )
  })

  it('returns the source unchanged when the key is missing or not a top-level boolean', () => {
    const noKey = '---\ntitle: Doc\n---\n# Body'
    expect(toggleFrontMatterBoolean(noKey, 'draft', true)).toBe(noKey)

    const nested = '---\nmeta:\n  draft: false\n---\n# Body'
    expect(toggleFrontMatterBoolean(nested, 'draft', true)).toBe(nested)

    const nonBoolean = '---\ndraft: maybe\n---\n# Body'
    expect(toggleFrontMatterBoolean(nonBoolean, 'draft', true)).toBe(nonBoolean)
  })

  it('returns the source unchanged when there is no front matter block', () => {
    const input = '# Body without front matter'
    expect(toggleFrontMatterBoolean(input, 'draft', true)).toBe(input)
  })
})
