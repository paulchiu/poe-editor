import { describe, expect, it } from 'vitest'
import { buildHtmlExportDocument } from '@/utils/htmlExport'

describe('htmlExport', () => {
  it('uses light markdown stylesheet for light mode exports', () => {
    const result = buildHtmlExportDocument({
      documentName: 'light.md',
      htmlContent: '<h1>Light</h1>',
      colorMode: 'light',
    })

    expect(result).toContain('github-markdown-light.min.css')
    expect(result).toContain('<meta name="color-scheme" content="light">')
    expect(result).toContain('--code-block-background: #f0efeb;')
    expect(result).toContain('--code-block-border: #c8b28f;')
    expect(result).toContain('--code-syntax-keyword: #a626a4;')
    expect(result).not.toContain('github-markdown-dark.min.css')
  })

  it('uses dark markdown stylesheet for dark mode exports', () => {
    const result = buildHtmlExportDocument({
      documentName: 'dark.md',
      htmlContent: '<h1>Dark</h1>',
      colorMode: 'dark',
    })

    expect(result).toContain('github-markdown-dark.min.css')
    expect(result).toContain('<meta name="color-scheme" content="dark">')
    expect(result).toContain('--code-block-background: #151b23;')
    expect(result).toContain('--code-block-border: #3d444db3;')
    expect(result).toContain('--code-syntax-keyword: var(--color-prettylights-syntax-keyword);')
    expect(result).toContain('background-color: #0d1117;')
    expect(result).not.toContain('github-markdown-light.min.css')
  })

  it('includes mermaid scripts only when rendered mermaid code exists', () => {
    const withoutMermaid = buildHtmlExportDocument({
      documentName: 'plain.md',
      htmlContent: '<p>Plain text</p>',
      colorMode: 'dark',
    })

    const withMermaid = buildHtmlExportDocument({
      documentName: 'diagram.md',
      htmlContent: '<pre><code class="hljs language-mermaid">graph TD;A-->B</code></pre>',
      colorMode: 'dark',
    })

    expect(withoutMermaid).not.toContain('mermaid.min.js')
    expect(withMermaid).toContain('mermaid.min.js')
    expect(withMermaid).toContain('"primaryBorderColor":"#4493f8"')
  })
})
