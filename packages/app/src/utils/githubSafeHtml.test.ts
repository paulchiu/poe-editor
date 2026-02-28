import { describe, it, expect } from 'vitest'
import { sanitizeGithubSafeHtml } from './githubSafeHtml'

describe('sanitizeGithubSafeHtml', () => {
  it('keeps github-safe tags and attributes', () => {
    const html = `
      <details open>
        <summary>See more</summary>
        <div align="center" data-raw-code="graph TD;A--&gt;B;">
          <input type="checkbox" class="task-list-item-checkbox" checked data-task-index="0" />
          <kbd>Ctrl</kbd> + <kbd>C</kbd>
          <img src="/image.png" alt="Preview" width="240" />
        </div>
      </details>
    `

    const sanitized = sanitizeGithubSafeHtml(html)

    expect(sanitized).toContain('<details open="">')
    expect(sanitized).toContain('<summary>See more</summary>')
    expect(sanitized).toContain('<div align="center" data-raw-code="graph TD;A-->B;">')
    expect(sanitized).toContain(
      '<input type="checkbox" class="task-list-item-checkbox" checked="" data-task-index="0">'
    )
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

  it('preserves section tags used by footnotes', () => {
    const html = '<section id="footnotes"><p><strong>hello</strong> world</p></section>'
    const sanitized = sanitizeGithubSafeHtml(html)
    expect(sanitized).toBe('<section id="footnotes"><p><strong>hello</strong> world</p></section>')
  })

  it('removes non-checkbox input elements', () => {
    const html = '<input type="text" value="x"><input type="checkbox" checked>'
    const sanitized = sanitizeGithubSafeHtml(html)

    expect(sanitized).toBe('<input type="checkbox" checked="">')
  })

  it('keeps extended markdown tags and heading ids', () => {
    const html =
      '<h2 id="section-a">Section A</h2><dl><dt>Term</dt><dd><mark>x</mark> H<sub>2</sub>O 19<sup>th</sup></dd></dl>'
    const sanitized = sanitizeGithubSafeHtml(html)

    expect(sanitized).toContain('<h2 id="section-a">Section A</h2>')
    expect(sanitized).toContain(
      '<dl><dt>Term</dt><dd><mark>x</mark> H<sub>2</sub>O 19<sup>th</sup></dd></dl>'
    )
  })
})
