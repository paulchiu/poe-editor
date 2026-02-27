import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import { sanitizeGithubSafeHtml } from '@/utils/githubSafeHtml'

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  cs: 'C#',
  csharp: 'C#',
  css: 'CSS',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  kotlin: 'Kotlin',
  markdown: 'Markdown',
  md: 'Markdown',
  mermaid: 'Mermaid',
  php: 'PHP',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  ruby: 'Ruby',
  rust: 'Rust',
  scss: 'SCSS',
  shell: 'Shell',
  sh: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  zsh: 'Shell',
}

function toLanguageLabel(language: string): string {
  const normalized = language.toLowerCase()
  const predefined = LANGUAGE_DISPLAY_NAMES[normalized]
  if (predefined) return predefined

  return normalized
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ')
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(highlightjs)

const GITHUB_CALLOUT_MARKER_TO_TYPE = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'important',
  WARNING: 'warning',
  CAUTION: 'caution',
} as const

type GithubCalloutMarker = keyof typeof GITHUB_CALLOUT_MARKER_TO_TYPE

const GITHUB_CALLOUT_MARKER_PATTERN = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:\r?\n|$)/i

function toCalloutTitle(marker: GithubCalloutMarker): string {
  return marker[0] + marker.slice(1).toLowerCase()
}

function transformGithubCalloutBlockquote(blockquote: Element, document: Document): void {
  const firstChild = blockquote.firstElementChild
  if (!firstChild || firstChild.tagName.toLowerCase() !== 'p') return

  const firstParagraph = firstChild as HTMLParagraphElement
  const markerMatch = firstParagraph.innerHTML.match(GITHUB_CALLOUT_MARKER_PATTERN)
  if (!markerMatch) return

  const marker = markerMatch[1]?.toUpperCase() as GithubCalloutMarker
  const calloutType = GITHUB_CALLOUT_MARKER_TO_TYPE[marker]
  if (!calloutType) return

  const calloutTitle = document.createElement('p')
  calloutTitle.className = 'markdown-alert-title'
  calloutTitle.textContent = toCalloutTitle(marker)
  blockquote.insertBefore(calloutTitle, blockquote.firstChild)
  blockquote.classList.add('markdown-alert', `markdown-alert-${calloutType}`)

  const remainingContent = firstParagraph.innerHTML.slice(markerMatch[0].length).trim()
  if (!remainingContent) {
    firstParagraph.remove()
    return
  }

  firstParagraph.innerHTML = remainingContent
}

function renderGithubCallouts(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const blockquotes = Array.from(document.body.querySelectorAll('blockquote'))

  for (const blockquote of blockquotes) {
    transformGithubCalloutBlockquote(blockquote, document)
  }

  return document.body.innerHTML
}

const defaultFenceRenderer = md.renderer.rules.fence?.bind(md.renderer.rules)

md.renderer.rules.fence = (tokens, idx, options, env, self): string => {
  const language = tokens[idx].info.trim().split(/\s+/)[0]?.toLowerCase()
  const rawCode = tokens[idx].content.replace(/\n$/, '')

  const renderedFence =
    language === 'mermaid'
      ? `<pre><code class="hljs language-mermaid">${md.utils.escapeHtml(tokens[idx].content)}</code></pre>`
      : (defaultFenceRenderer?.(tokens, idx, options, env, self) ??
        self.renderToken(tokens, idx, options))

  if (!language) return renderedFence

  const escapedLanguage = md.utils.escapeHtml(language)
  const escapedLabel = md.utils.escapeHtml(toLanguageLabel(language))
  const dataRawCodeAttribute =
    language === 'mermaid' ? ` data-raw-code="${md.utils.escapeHtml(rawCode)}"` : ''

  return `<div class="code-block-with-language" data-language="${escapedLanguage}"${dataRawCodeAttribute}><div class="code-block-language-hint">${escapedLabel}</div>${renderedFence}</div>`
}

/**
 * Renders markdown text to HTML
 * @param markdown - The markdown text to render
 * @returns HTML string (empty string if input is empty)
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  const html = md.render(markdown)
  const withGithubCallouts = renderGithubCallouts(html)
  return sanitizeGithubSafeHtml(withGithubCallouts)
}

/**
 * Extracts the first heading from markdown text
 * @param markdown - The markdown text to parse
 * @returns The text content of the first heading, or null if none found
 */
export function getFirstHeading(markdown: string): string | null {
  if (!markdown) return null

  // Use a fresh instance to avoid side effects or state issues,
  // though parse() is generally stateless.
  // We can reuse the exported md instance if we want to share config.
  const tokens = md.parse(markdown, {})

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open') {
      // The next token should be inline content
      const nextToken = tokens[i + 1]
      if (nextToken && nextToken.type === 'inline') {
        return nextToken.content
      }
    }
  }

  return null
}
