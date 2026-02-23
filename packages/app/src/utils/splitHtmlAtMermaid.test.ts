import { describe, it, expect } from 'vitest'
import { splitHtmlAtMermaid } from './splitHtmlAtMermaid'

describe('splitHtmlAtMermaid', () => {
  it('returns single html segment when no mermaid blocks', () => {
    const html = '<h1>Hello</h1><p>World</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([{ type: 'html', content: html }])
  })

  it('extracts a mermaid code block', () => {
    const html =
      '<p>Before</p><pre><code class="hljs language-mermaid">graph TD;\n    A--&gt;B;</code></pre><p>After</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([
      { type: 'html', content: '<p>Before</p>' },
      { type: 'mermaid', code: 'graph TD;\n    A-->B;' },
      { type: 'html', content: '<p>After</p>' },
    ])
  })

  it('handles multiple mermaid blocks', () => {
    const html =
      '<p>A</p><pre><code class="hljs language-mermaid">graph LR; X--&gt;Y</code></pre><p>B</p><pre><code class="hljs language-mermaid">sequenceDiagram\n    A-&gt;&gt;B: Hello</code></pre><p>C</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toHaveLength(5)
    expect(result[0]).toEqual({ type: 'html', content: '<p>A</p>' })
    expect(result[1]).toEqual({ type: 'mermaid', code: 'graph LR; X-->Y' })
    expect(result[2]).toEqual({ type: 'html', content: '<p>B</p>' })
    expect(result[3]).toEqual({ type: 'mermaid', code: 'sequenceDiagram\n    A->>B: Hello' })
    expect(result[4]).toEqual({ type: 'html', content: '<p>C</p>' })
  })

  it('handles mermaid block at the start', () => {
    const html = '<pre><code class="hljs language-mermaid">graph TD; A</code></pre><p>After</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([
      { type: 'mermaid', code: 'graph TD; A' },
      { type: 'html', content: '<p>After</p>' },
    ])
  })

  it('handles mermaid block at the end', () => {
    const html = '<p>Before</p><pre><code class="hljs language-mermaid">graph TD; A</code></pre>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([
      { type: 'html', content: '<p>Before</p>' },
      { type: 'mermaid', code: 'graph TD; A' },
    ])
  })

  it('decodes HTML entities in mermaid code', () => {
    const html =
      '<pre><code class="hljs language-mermaid">A &amp; B &lt;-- C &gt; D &quot;E&quot; &#39;F&#39;</code></pre>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([{ type: 'mermaid', code: 'A & B <-- C > D "E" \'F\'' }])
  })

  it('extracts wrapped mermaid code blocks with language hints', () => {
    const html =
      '<p>Before</p><div class="code-block-with-language" data-language="mermaid"><div class="code-block-language-hint">Mermaid</div><pre><code class="hljs language-mermaid">graph TD;\nA--&gt;B;</code></pre></div><p>After</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([
      { type: 'html', content: '<p>Before</p>' },
      { type: 'mermaid', code: 'graph TD;\nA-->B;' },
      { type: 'html', content: '<p>After</p>' },
    ])
  })

  it('keeps non-mermaid wrapped code blocks when mermaid exists in the same html', () => {
    const html =
      '<p>Intro</p><div class="code-block-with-language" data-language="ts"><div class="code-block-language-hint">TypeScript</div><pre><code class="hljs language-ts">const value = 1</code></pre></div><p>Middle</p><div class="code-block-with-language" data-language="mermaid"><div class="code-block-language-hint">Mermaid</div><pre><code class="hljs language-mermaid">graph TD;\nA--&gt;B;</code></pre></div><p>End</p>'
    const result = splitHtmlAtMermaid(html)
    expect(result).toEqual([
      {
        type: 'html',
        content:
          '<p>Intro</p><div class="code-block-with-language" data-language="ts"><div class="code-block-language-hint">TypeScript</div><pre><code class="hljs language-ts">const value = 1</code></pre></div><p>Middle</p>',
      },
      { type: 'mermaid', code: 'graph TD;\nA-->B;' },
      { type: 'html', content: '<p>End</p>' },
    ])
  })

  it('returns empty array for empty input', () => {
    expect(splitHtmlAtMermaid('')).toEqual([])
  })
})
