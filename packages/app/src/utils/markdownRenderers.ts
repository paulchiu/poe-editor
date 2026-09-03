import MarkdownItFactory from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import type { MarkdownIt, StateBlock, StateInline, Token } from 'markdown-it'

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  'c++': 'C++',
  cpp: 'C++',
  cs: 'C#',
  csharp: 'C#',
  css: 'CSS',
  diff: 'Diff',
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
  patch: 'Patch',
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

/** Matches possible emoji shortcode candidates to trigger lazy emoji parser loading. */
export const EMOJI_SHORTCODE_PATTERN = /:[a-zA-Z0-9_+-]+:/

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

function applyFenceRenderer(markdown: MarkdownIt): void {
  const defaultFenceRenderer = markdown.renderer.rules.fence?.bind(markdown.renderer.rules)

  markdown.renderer.rules.fence = (tokens, idx, options, env, self): string => {
    const language = tokens[idx].info.trim().split(/\s+/)[0]?.toLowerCase()
    const rawCode = tokens[idx].content.replace(/\n$/, '')

    const renderedFence =
      language === 'mermaid'
        ? `<pre><code class="hljs language-mermaid">${markdown.utils.escapeHtml(tokens[idx].content)}</code></pre>`
        : (defaultFenceRenderer?.(tokens, idx, options, env, self) ??
          self.renderToken(tokens, idx, options))

    if (!language) return renderedFence

    const escapedLanguage = markdown.utils.escapeHtml(language)
    const escapedLabel = markdown.utils.escapeHtml(toLanguageLabel(language))
    const dataRawCodeAttribute =
      language === 'mermaid' ? ` data-raw-code="${markdown.utils.escapeHtml(rawCode)}"` : ''

    return `<div class="code-block-with-language" data-language="${escapedLanguage}"${dataRawCodeAttribute}><div class="code-block-language-hint">${escapedLabel}</div>${renderedFence}</div>`
  }
}

function createDelimitedInlineRule(marker: '==' | '^' | '~', tag: 'mark' | 'sup' | 'sub') {
  return (state: StateInline, silent: boolean): boolean => {
    const markerLength = marker.length
    const start = state.pos

    if (state.src.slice(start, start + markerLength) !== marker) return false
    if (marker === '~' && state.src[start + 1] === '~') return false
    if (start > 0 && state.src[start - 1] === '\\') return false

    let end = state.src.indexOf(marker, start + markerLength)
    while (end !== -1) {
      if (state.src[end - 1] !== '\\') break
      end = state.src.indexOf(marker, end + markerLength)
    }

    if (end === -1 || end >= state.posMax) return false

    const content = state.src.slice(start + markerLength, end)
    if (!content || /^\s|\s$/.test(content)) return false
    if ((marker === '^' || marker === '~') && /\s/.test(content)) return false

    if (!silent) {
      const tokenOpen = state.push(`${tag}_open`, tag, 1)
      tokenOpen.markup = marker

      const tokenText = state.push('text', '', 0)
      tokenText.content = content

      const tokenClose = state.push(`${tag}_close`, tag, -1)
      tokenClose.markup = marker
    }

    state.pos = end + markerLength
    return true
  }
}

function definitionListRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean
): boolean {
  if (startLine + 1 >= endLine) return false
  if (state.sCount[startLine] - state.blkIndent >= 4) return false

  const getLine = (line: number): string =>
    state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line])

  const isDefinitionMarker = (line: number): boolean => /^:\s+/.test(getLine(line))

  const firstTerm = state.getLines(startLine, startLine + 1, 0, false).trim()
  if (!firstTerm || firstTerm.startsWith(':') || !isDefinitionMarker(startLine + 1)) return false
  if (silent) return true

  const dlOpen = state.push('dl_open', 'dl', 1)
  dlOpen.map = [startLine, 0]

  let line = startLine
  while (line < endLine) {
    const term = state.getLines(line, line + 1, 0, false).trim()
    if (!term || term.startsWith(':') || line + 1 >= endLine || !isDefinitionMarker(line + 1)) break

    const dtOpen = state.push('dt_open', 'dt', 1)
    dtOpen.map = [line, line + 1]

    const dtInline = state.push('inline', '', 0)
    dtInline.content = term
    dtInline.children = []

    state.push('dt_close', 'dt', -1)

    line += 1
    while (line < endLine && isDefinitionMarker(line)) {
      const definitionLines: string[] = [getLine(line).replace(/^:\s+/, '')]
      const ddStart = line
      line += 1

      while (line < endLine) {
        const rawLine = getLine(line)
        const fullRawLine = state.src.slice(state.bMarks[line], state.eMarks[line])
        if (isDefinitionMarker(line)) break

        if (!rawLine.trim()) {
          definitionLines.push('')
          line += 1
          continue
        }

        if (/^\s{2,}\S/.test(fullRawLine)) {
          definitionLines.push(fullRawLine.replace(/^\s{2,}/, ''))
          line += 1
          continue
        }

        break
      }

      const ddOpen = state.push('dd_open', 'dd', 1)
      ddOpen.map = [ddStart, line]

      const innerTokens: Token[] = []
      state.md.block.parse(definitionLines.join('\n'), state.md, state.env, innerTokens)
      for (const token of innerTokens) {
        state.tokens.push(token)
      }

      state.push('dd_close', 'dd', -1)
    }

    while (line < endLine && state.isEmpty(line)) {
      line += 1
    }
  }

  const dlClose = state.push('dl_close', 'dl', -1)
  dlClose.map = [startLine, line]
  state.line = line
  return true
}

/**
 * Creates a configured markdown-it parser with optional extended syntax features.
 * @param enableExtendedMarkdown - Whether to enable custom syntax rules.
 * @returns Configured markdown-it parser instance.
 */
export function createMarkdownIt(enableExtendedMarkdown: boolean): MarkdownIt {
  const parser = new MarkdownItFactory({
    html: true,
    linkify: true,
    typographer: true,
  }).use(highlightjs)

  /** linkify-it 6 defaults fuzzyLink off; keep autolinking bare hosts like www.example.com. */
  parser.linkify.set({ fuzzyLink: true })

  parser.renderer.rules.s_open = () => '<del>'
  parser.renderer.rules.s_close = () => '</del>'

  if (enableExtendedMarkdown) {
    parser.inline.ruler.after('emphasis', 'poe_mark', createDelimitedInlineRule('==', 'mark'))
    parser.inline.ruler.after('emphasis', 'poe_sup', createDelimitedInlineRule('^', 'sup'))
    parser.inline.ruler.after('emphasis', 'poe_sub', createDelimitedInlineRule('~', 'sub'))
    parser.block.ruler.before('paragraph', 'poe_deflist', definitionListRule)
  }

  applyFenceRenderer(parser)
  return parser
}
