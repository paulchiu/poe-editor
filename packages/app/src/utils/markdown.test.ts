import { describe, it, expect } from 'vitest'
import { renderMarkdown, getFirstHeading, getTocHeadings } from './markdown'

describe('renderMarkdown', () => {
  it('should render basic markdown', () => {
    const markdown = '# Hello\n\n**Bold** and *Italic*'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<h1 id="hello">Hello</h1>')
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

  it('should syntax-highlight diff code blocks with addition and deletion spans', () => {
    const markdown = [
      '```diff',
      '--- a/foo',
      '+++ b/foo',
      '@@ -1,3 +1,3 @@',
      ' context line',
      '-removed line',
      '+added line',
      '```',
    ].join('\n')
    const html = renderMarkdown(markdown)

    expect(html).toContain('<div class="code-block-with-language" data-language="diff">')
    expect(html).toContain('<div class="code-block-language-hint">Diff</div>')
    expect(html).toContain('<pre><code class="hljs language-diff">')
    expect(html).toContain('<span class="hljs-deletion">-removed line</span>')
    expect(html).toContain('<span class="hljs-addition">+added line</span>')
    expect(html).toContain('<span class="hljs-comment">--- a/foo</span>')
    expect(html).toContain('<span class="hljs-comment">+++ b/foo</span>')
  })

  it('should label patch code blocks as Patch and apply diff highlighting', () => {
    const markdown = '```patch\n-old\n+new\n```'
    const html = renderMarkdown(markdown)

    expect(html).toContain('<div class="code-block-language-hint">Patch</div>')
    expect(html).toContain('class="hljs language-patch"')
    expect(html).toContain('<span class="hljs-deletion">-old</span>')
    expect(html).toContain('<span class="hljs-addition">+new</span>')
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

  it('should render front matter as a properties panel before the markdown body', () => {
    const markdown = [
      '---',
      'title: Front Matter Title',
      'tags: [poe, preview]',
      'draft: false',
      '---',
      '# Body Title',
      '',
      'Body text.',
    ].join('\n')
    const html = renderMarkdown(markdown)

    expect(html).toContain('class="front-matter-properties"')
    expect(html).toContain('<th class="front-matter-key">title</th>')
    expect(html).toContain('<span class="front-matter-value-text">Front Matter Title</span>')
    expect(html).toContain('<span class="front-matter-chip front-matter-tag">poe</span>')
    expect(html).toContain('<h1 id="body-title">Body Title</h1>')
    expect(html).not.toContain('<hr>')
    expect(html).not.toContain('---')
  })

  it('should sanitize unsafe front matter property values', () => {
    const html = renderMarkdown('---\ntitle: "<img src=x onerror=alert(1)>"\n---\n# Body')

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src="x"')
  })

  it('should render strikethrough across common markdown containers', () => {
    const markdown = `~~paragraph~~

- ~~list item~~

> ~~blockquote~~

| col |
| --- |
| ~~table cell~~ |`
    const html = renderMarkdown(markdown)

    expect(html).toContain('<p><del>paragraph</del></p>')
    expect(html).toContain('<li><del>list item</del></li>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<p><del>blockquote</del></p>')
    expect(html).toContain('<td><del>table cell</del></td>')
  })

  it('should autolink URL and email literals but skip code spans and fences', () => {
    const markdown = `Visit https://example.com and www.example.com or email a@b.com.

\`https://example.com a@b.com\`

\`\`\`
https://example.com
a@b.com
\`\`\``
    const html = renderMarkdown(markdown)

    expect(html).toContain('<a href="https://example.com">https://example.com</a>')
    expect(html).toContain('<a href="http://www.example.com">www.example.com</a>')
    expect(html).toContain('<a href="mailto:a@b.com">a@b.com</a>')
    expect(html).toContain('<code>https://example.com a@b.com</code>')
    expect(html).toContain('<pre><code class="hljs">')
    expect(html).toContain('https:<span class="hljs-comment">//example.com</span>')
    expect(html).toContain(
      'a@<span class="hljs-selector-tag">b</span><span class="hljs-selector-class">.com</span>'
    )
    expect(html).not.toContain('<code><a href=')
  })

  it('should render footnotes with references, backrefs, and multi-paragraph definitions', () => {
    const markdown = `Alpha[^1] and beta[^2] and alpha again[^1].

[^1]: First footnote.

    Continued paragraph.

[^2]: Second footnote.`
    const html = renderMarkdown(markdown)

    expect(html).toContain('class="footnote-ref"')
    expect(html).toContain('id="fnref1"')
    expect(html).toContain('href="#fn1"')
    expect(html).toContain('id="fnref1:1"')
    expect(html).toContain('id="fn1"')
    expect(html).toContain('id="fn2"')
    expect(html).toContain('<section class="footnotes">')
    expect(html).toContain('class="footnote-backref"')
    expect(html).toContain('<p>First footnote.</p>')
    expect(html).toContain('<p>Continued paragraph.')
  })

  it('should render links', () => {
    const markdown = '[link](https://example.com)'
    const html = renderMarkdown(markdown)
    expect(html).toContain('<a href="https://example.com">link</a>')
  })

  it('should render task list items as checkbox inputs', () => {
    const markdown = '- [ ] todo\n- [x] done'
    const html = renderMarkdown(markdown)

    expect(html).toContain('<ul class="contains-task-list">')
    expect(html).toContain('<li class="task-list-item">')
    expect(html).toContain(
      '<input type="checkbox" class="task-list-item-checkbox" data-task-index="0"'
    )
    expect(html).toContain('data-task-index="1"')
    expect(html).toContain('checked=""')
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

  it('should ignore front matter before heading', () => {
    expect(getFirstHeading('---\ntitle: Metadata title\n---\n# Real Title')).toBe('Real Title')
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

describe('extended markdown', () => {
  it('should render TOC directive with stable nested anchors', () => {
    const markdown = [
      '<!-- TOC -->',
      '# Intro',
      '## Child',
      '# Intro',
      '```md',
      '# ignored',
      '```',
    ].join('\n')

    const html = renderMarkdown(markdown)

    expect(html).toContain('<div class="markdown-toc" aria-label="Table of contents">')
    expect(html).toContain('<a href="#intro">Intro</a>')
    expect(html).toContain('<a href="#child">Child</a>')
    expect(html).toContain('<a href="#intro-1">Intro</a>')
    expect(html).toContain('<h1 id="intro">Intro</h1>')
    expect(html).toContain('<h2 id="child">Child</h2>')
    expect(html).toContain('<h1 id="intro-1">Intro</h1>')
    expect(html).not.toContain('href="#ignored"')
  })

  it('should ignore front matter when collecting TOC headings', () => {
    const headings = getTocHeadings('---\ntitle: Metadata title\n---\n# Real Title\n## Child')

    expect(headings).toEqual([
      { level: 1, text: 'Real Title', id: 'real-title' },
      { level: 2, text: 'Child', id: 'child' },
    ])
  })

  it('should replace TOC directive', () => {
    const html = renderMarkdown('<!-- TOC -->\n# Title')
    expect(html).toContain('markdown-toc')
  })

  it('should render superscript and subscript', () => {
    const html = renderMarkdown('19^th^ and H~2~O')
    expect(html).toContain('<sup>th</sup>')
    expect(html).toContain('H<sub>2</sub>O')
  })

  it('should honor escapes and code spans for superscript/subscript', () => {
    const html = renderMarkdown('\\^keep^ `19^th^` `H~2~O`')
    expect(html).toContain('^keep^')
    expect(html).toContain('<code>19^th^</code>')
    expect(html).toContain('<code>H~2~O</code>')
  })

  it('should render highlight marks and ignore code spans', () => {
    const html = renderMarkdown('==text== `==code==`')
    expect(html).toContain('<mark>text</mark>')
    expect(html).toContain('<code>==code==</code>')
  })

  it('should render definition lists with single, multiple, and multi-paragraph definitions', () => {
    const markdown = [
      'Term 1',
      ': Definition text with *inline* markdown',
      '',
      'Term 2',
      ': Definition A',
      ': Definition B',
      '',
      'Term 3',
      ': First paragraph',
      '',
      '  Continued paragraph for the same definition.',
      '',
      '```',
      'Term 4',
      ': should be ignored in fence',
      '```',
    ].join('\n')

    const html = renderMarkdown(markdown)

    expect(html).toContain('<dl>')
    expect(html).toContain('<dt>Term 1</dt>')
    expect(html).toContain('<p>Definition text with <em>inline</em> markdown</p>')
    expect(html).toContain('<dt>Term 2</dt>')
    expect(html).toContain('<p>Definition A</p>')
    expect(html).toContain('<p>Definition B</p>')
    expect(html).toContain('<dt>Term 3</dt>')
    expect(html).toContain('<p>Continued paragraph for the same definition.</p>')
    expect(html).not.toContain('<dt>Term 4</dt>')
  })
})
