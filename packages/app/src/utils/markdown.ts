import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import type Token from 'markdown-it/lib/token.mjs'
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

interface MarkdownHeading {
  level: number
  text: string
  id: string
}

/**
 * Represents a heading entry used for table-of-contents rendering.
 */
export interface TocHeading {
  level: number
  text: string
  id: string
}

type MarkdownTokenNesting = -1 | 0 | 1

interface MarkdownItInlineRuleState {
  src: string
  pos: number
  posMax: number
  push: (type: string, tag: string, nesting: MarkdownTokenNesting) => Token
}

interface MarkdownItBlockRuleState {
  sCount: number[]
  blkIndent: number
  src: string
  bMarks: number[]
  tShift: number[]
  eMarks: number[]
  env: object
  md: MarkdownIt
  tokens: Token[]
  line: number
  getLines: (begin: number, end: number, indent: number, keepLastLF: boolean) => string
  push: (type: string, tag: string, nesting: MarkdownTokenNesting) => Token
  isEmpty: (line: number) => boolean
}

type FootnoteDefinition = {
  index: number
  label: string
  content: string
}

type ParsedFootnotes = {
  markdown: string
  definitions: FootnoteDefinition[]
  referencesByLabel: Map<string, string[]>
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
  return (state: MarkdownItInlineRuleState, silent: boolean): boolean => {
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
  state: MarkdownItBlockRuleState,
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

function createMarkdownIt(enableExtendedMarkdown: boolean): MarkdownIt {
  const parser = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  }).use(highlightjs)

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

const baseMarkdown = createMarkdownIt(false)
const markdownRenderer = createMarkdownIt(true)
const EMOJI_SHORTCODE_PATTERN = /:[a-zA-Z0-9_+-]+:/

type MarkdownItPlugin = (markdown: MarkdownIt) => void

let emojiMarkdownRendererPromise: Promise<MarkdownIt> | null = null

async function getEmojiMarkdownRenderer(): Promise<MarkdownIt> {
  if (!emojiMarkdownRendererPromise) {
    emojiMarkdownRendererPromise = (async () => {
      const { full } = await import('markdown-it-emoji')
      const parser = createMarkdownIt(true)
      parser.use(full as MarkdownItPlugin)
      return parser
    })()
  }

  try {
    return await emojiMarkdownRendererPromise
  } catch (error) {
    emojiMarkdownRendererPromise = null
    throw error
  }
}

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

function renderTaskLists(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const listItems = Array.from(document.body.querySelectorAll('li'))
  let taskIndex = 0

  for (const listItem of listItems) {
    const firstElement = listItem.firstElementChild
    const container =
      firstElement && firstElement.tagName.toLowerCase() === 'p' ? firstElement : listItem
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

    let firstTextNode: Text | null = null
    while (walker.nextNode()) {
      const candidate = walker.currentNode as Text
      const candidateText = candidate.textContent ?? ''
      if (candidateText.trim().length === 0) continue
      firstTextNode = candidate
      break
    }

    if (!firstTextNode) continue

    const initialText = firstTextNode.textContent ?? ''
    const taskPrefixMatch = initialText.match(/^(\s*)\[([ xX])\](\s+|$)/)
    if (!taskPrefixMatch) continue

    const checked = taskPrefixMatch[2].toLowerCase() === 'x'
    firstTextNode.textContent = initialText.slice(taskPrefixMatch[0].length)

    const checkbox = document.createElement('input')
    checkbox.setAttribute('type', 'checkbox')
    checkbox.setAttribute('class', 'task-list-item-checkbox')
    checkbox.setAttribute('data-task-index', String(taskIndex))
    checkbox.setAttribute('aria-label', `Toggle task ${taskIndex + 1}`)
    if (checked) checkbox.setAttribute('checked', '')

    container.insertBefore(checkbox, firstTextNode)
    container.insertBefore(document.createTextNode(' '), firstTextNode)

    listItem.classList.add('task-list-item')
    const parentList = listItem.closest('ul,ol')
    if (parentList) parentList.classList.add('contains-task-list')

    taskIndex += 1
  }

  return document.body.innerHTML
}

function parseFootnotes(markdown: string): ParsedFootnotes {
  const lines = markdown.split('\n')
  const keptLines: string[] = []
  const definitionsByLabel = new Map<string, FootnoteDefinition>()
  const definitionOrder: FootnoteDefinition[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const definitionMatch = lines[index].match(/^\[\^([^\]]+)\]:\s?(.*)$/)
    if (!definitionMatch) {
      keptLines.push(lines[index])
      continue
    }

    const label = definitionMatch[1]
    const contentLines = [definitionMatch[2]]

    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1]
      if (nextLine.startsWith('    ') || nextLine.startsWith('\t')) {
        contentLines.push(nextLine.replace(/^(?: {4}|\t)/, ''))
        index += 1
        continue
      }

      if (nextLine.trim().length === 0) {
        contentLines.push('')
        index += 1
        continue
      }

      break
    }

    const existing = definitionsByLabel.get(label)
    if (existing) {
      existing.content = contentLines.join('\n').trim()
      continue
    }

    const definition: FootnoteDefinition = {
      index: definitionOrder.length + 1,
      label,
      content: contentLines.join('\n').trim(),
    }

    definitionsByLabel.set(label, definition)
    definitionOrder.push(definition)
  }

  const referenceCounts = new Map<string, number>()
  const referencesByLabel = new Map<string, string[]>()
  const markdownWithReferences = keptLines
    .join('\n')
    .replace(/\[\^([^\]]+)\]/g, (match, label: string) => {
      const definition = definitionsByLabel.get(label)
      if (!definition) return match

      const currentCount = referenceCounts.get(label) ?? 0
      const referenceId =
        currentCount === 0 ? `fnref${definition.index}` : `fnref${definition.index}:${currentCount}`
      const references = referencesByLabel.get(label) ?? []
      references.push(referenceId)
      referencesByLabel.set(label, references)
      referenceCounts.set(label, currentCount + 1)

      return `<sup class="footnote-ref"><a href="#fn${definition.index}" id="${referenceId}">[${definition.index}]</a></sup>`
    })

  return {
    markdown: markdownWithReferences,
    definitions: definitionOrder,
    referencesByLabel,
  }
}

function renderFootnotes(
  definitions: FootnoteDefinition[],
  referencesByLabel: Map<string, string[]>,
  markdownRenderer: MarkdownIt
): string {
  if (definitions.length === 0) return ''

  const items = definitions
    .map((definition) => {
      const renderedContent = markdownRenderer.render(definition.content).trim()
      const backrefs = (referencesByLabel.get(definition.label) ?? [])
        .map((referenceId) => `<a href="#${referenceId}" class="footnote-backref">↩︎</a>`)
        .join(' ')

      return `<li id="fn${definition.index}" class="footnote-item">${renderedContent}<p>${backrefs}</p></li>`
    })
    .join('')

  return `<hr class="footnotes-sep"><section class="footnotes"><ol class="footnotes-list">${items}</ol></section>`
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

function createHeadingIdFactory(): (headingText: string) => string {
  const seenSlugs = new Map<string, number>()
  return (headingText: string): string => {
    const baseSlug = slugifyHeading(headingText) || 'section'
    const count = seenSlugs.get(baseSlug) ?? 0
    seenSlugs.set(baseSlug, count + 1)
    return count === 0 ? baseSlug : `${baseSlug}-${count}`
  }
}

function collectHeadings(markdown: string): MarkdownHeading[] {
  const tokens = baseMarkdown.parse(markdown, {})
  const nextHeadingId = createHeadingIdFactory()
  const headings: MarkdownHeading[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== 'heading_open') continue
    const headingContent = tokens[index + 1]
    if (!headingContent || headingContent.type !== 'inline') continue

    const level = Number.parseInt(tokens[index].tag.slice(1), 10)
    const text = headingContent.content.trim()
    if (!text) continue

    headings.push({ level, text, id: nextHeadingId(text) })
  }

  return headings
}

function applyHeadingIds(html: string, headings: MarkdownHeading[]): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const document = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const headingElements = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6'))

  for (let index = 0; index < headingElements.length; index += 1) {
    const heading = headings[index]
    if (!heading) break
    headingElements[index].setAttribute('id', heading.id)
  }

  return document.body.innerHTML
}

function generateTocHtml(headings: MarkdownHeading[]): string {
  if (!headings.length) return ''

  const parts: string[] = ['<div class="markdown-toc" aria-label="Table of contents"><ul>']
  const stack: number[] = [headings[0].level]

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]
    const previousLevel = index === 0 ? heading.level : headings[index - 1].level

    if (index > 0 && heading.level > previousLevel) {
      for (let level = previousLevel; level < heading.level; level += 1) {
        parts.push('<ul>')
        stack.push(level + 1)
      }
    } else if (heading.level < previousLevel) {
      for (let level = previousLevel; level > heading.level; level -= 1) {
        parts.push('</li></ul>')
        stack.pop()
      }
      parts.push('</li>')
    } else if (index > 0) {
      parts.push('</li>')
    }

    const escapedText = baseMarkdown.utils.escapeHtml(heading.text)
    const escapedId = baseMarkdown.utils.escapeHtml(heading.id)
    parts.push(`<li><a href="#${escapedId}">${escapedText}</a>`)
  }

  while (stack.length > 1) {
    parts.push('</li></ul>')
    stack.pop()
  }

  parts.push('</li></ul></div>')
  return parts.join('')
}

function injectTocDirective(html: string, headings: MarkdownHeading[]): string {
  if (!/<!--\s*TOC\s*-->/.test(html)) return html
  return html.replace(/<!--\s*TOC\s*-->/g, generateTocHtml(headings))
}

/**
 * Gets table-of-contents headings from markdown.
 * @param markdown - Markdown source content.
 * @returns Ordered heading entries with stable ids.
 */
export function getTocHeadings(markdown: string): TocHeading[] {
  if (!markdown) return []
  return collectHeadings(markdown)
}

function renderMarkdownWithRenderer(markdown: string, renderer: MarkdownIt): string {
  if (!markdown) return ''

  const headings = collectHeadings(markdown)
  const {
    markdown: markdownWithReferences,
    definitions,
    referencesByLabel,
  } = parseFootnotes(markdown)

  const renderedBody = renderer.render(markdownWithReferences)
  const withHeadingIds = applyHeadingIds(renderedBody, headings)
  const withTocDirective = injectTocDirective(withHeadingIds, headings)
  const withFootnotes = `${withTocDirective}${renderFootnotes(
    definitions,
    referencesByLabel,
    renderer
  )}`
  const withGithubCallouts = renderGithubCallouts(withFootnotes)
  const withTaskLists = renderTaskLists(withGithubCallouts)
  return sanitizeGithubSafeHtml(withTaskLists)
}

/**
 * Renders markdown text to HTML.
 * @param markdown - The markdown text to render.
 * @returns HTML string (empty string if input is empty).
 */
export function renderMarkdown(markdown: string): string {
  return renderMarkdownWithRenderer(markdown, markdownRenderer)
}

/**
 * Renders markdown for the live preview, enabling lazy emoji shortcode support.
 * @param markdown - The markdown text to render.
 * @returns HTML string (empty string if input is empty).
 */
export async function renderMarkdownForPreview(markdown: string): Promise<string> {
  if (!markdown) return ''
  if (!EMOJI_SHORTCODE_PATTERN.test(markdown)) {
    return renderMarkdownWithRenderer(markdown, markdownRenderer)
  }

  const emojiRenderer = await getEmojiMarkdownRenderer()
  return renderMarkdownWithRenderer(markdown, emojiRenderer)
}

/**
 * Extracts the first heading from markdown text.
 * @param markdown - The markdown text to parse.
 * @returns The text content of the first heading, or null if none found.
 */
export function getFirstHeading(markdown: string): string | null {
  if (!markdown) return null

  const tokens = baseMarkdown.parse(markdown, {})

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'heading_open') {
      const nextToken = tokens[i + 1]
      if (nextToken && nextToken.type === 'inline') {
        return nextToken.content
      }
    }
  }

  return null
}
