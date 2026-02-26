import { describe, it, expect } from 'vitest'
import { sanitizeGithubSafeHtml } from './githubSafeHtml'

describe('sanitizeGithubSafeHtml', () => {
  it('keeps github-safe tags and attributes', () => {
    const html = `
      <details open>
        <summary>See more</summary>
        <div align="center">
          <kbd>Ctrl</kbd> + <kbd>C</kbd>
          <img src="/image.png" alt="Preview" width="240" />
        </div>
      </details>
    `

    const sanitized = sanitizeGithubSafeHtml(html)

    expect(sanitized).toContain('<details open="">')
    expect(sanitized).toContain('<summary>See more</summary>')
    expect(sanitized).toContain('<div align="center">')
    expect(sanitized).toContain('<kbd>Ctrl</kbd>')
    expect(sanitized).toContain('<img src="/image.png" alt="Preview" width="240">')
  })

  it('removes unsafe tags and attributes', () => {
    const html = `
      <script>alert('xss')</script>
      <a href="javascript:alert(1)" onclick="alert(1)">click</a>
      <img src="data:text/html;base64,abc123" onerror="alert(1)" />
    `

    const sanitized = sanitizeGithubSafeHtml(html)

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('<a>click</a>')
    expect(sanitized).toContain('<img>')
    expect(sanitized).not.toContain('javascript:')
    expect(sanitized).not.toContain('onerror')
    expect(sanitized).not.toContain('onclick')
  })

  it('unwraps unsupported tags while preserving safe children', () => {
    const html = '<section><p><strong>hello</strong> world</p></section>'
    const sanitized = sanitizeGithubSafeHtml(html)
    expect(sanitized).toBe('<p><strong>hello</strong> world</p>')
  })
})
