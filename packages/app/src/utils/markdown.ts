import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'

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
  html: false,
  linkify: true,
  typographer: true,
}).use(highlightjs)

const defaultFenceRenderer = md.renderer.rules.fence?.bind(md.renderer.rules)

md.renderer.rules.fence = (tokens, idx, options, env, self): string => {
  const language = tokens[idx].info.trim().split(/\s+/)[0]?.toLowerCase()

  const renderedFence =
    language === 'mermaid'
      ? `<pre><code class="hljs language-mermaid">${md.utils.escapeHtml(tokens[idx].content)}</code></pre>`
      : (defaultFenceRenderer?.(tokens, idx, options, env, self) ??
        self.renderToken(tokens, idx, options))

  if (!language) return renderedFence

  const escapedLanguage = md.utils.escapeHtml(language)
  const escapedLabel = md.utils.escapeHtml(toLanguageLabel(language))

  return `<div class="code-block-with-language" data-language="${escapedLanguage}"><div class="code-block-language-hint">${escapedLabel}</div>${renderedFence}</div>`
}

/**
 * Renders markdown text to HTML
 * @param markdown - The markdown text to render
 * @returns HTML string (empty string if input is empty)
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  return md.render(markdown)
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
