import { parse } from 'yaml'

const FRONT_MATTER_OPEN_DELIMITER = '---'
const FRONT_MATTER_CLOSE_DELIMITER_PATTERN = /^(?:---|\.\.\.)[ \t]*$/
const MAX_FRONT_MATTER_BYTES = 16 * 1024
const MAX_FRONT_MATTER_DEPTH = 4

export interface FrontMatterProperty {
  key: string
  value: FrontMatterDisplayValue
}

export interface FrontMatterData {
  properties: FrontMatterProperty[]
}

export interface FrontMatterParseResult {
  frontMatter: FrontMatterData
  body: string
  sourcePrefix: string
}

type FrontMatterDisplayValue =
  | { type: 'empty' }
  | { type: 'text'; value: string }
  | { type: 'number'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'list'; items: string[]; isTagList: boolean }
  | { type: 'object'; entries: FrontMatterObjectEntry[] }

interface FrontMatterObjectEntry {
  key: string
  value: FrontMatterDisplayValue
}

interface FrontMatterBlock {
  yaml: string
  body: string
  sourcePrefix: string
  yamlStart: number
  yamlEnd: number
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

function getLineEndIndex(value: string, start: number): number {
  const nextLineBreak = value.indexOf('\n', start)
  return nextLineBreak === -1 ? value.length : nextLineBreak
}

function getNextLineStart(value: string, lineEnd: number): number {
  return lineEnd < value.length ? lineEnd + 1 : value.length
}

function stripTrailingCarriageReturn(value: string): string {
  return value.endsWith('\r') ? value.slice(0, -1) : value
}

function extractFrontMatterBlock(markdown: string): FrontMatterBlock | null {
  if (!markdown) return null

  const source = markdown
  const openingLineStart = source.charCodeAt(0) === 0xfeff ? 1 : 0
  const openingLineEnd = getLineEndIndex(source, openingLineStart)
  const openingLine = stripTrailingCarriageReturn(source.slice(openingLineStart, openingLineEnd))
  if (openingLine.trimEnd() !== FRONT_MATTER_OPEN_DELIMITER) return null
  if (openingLineEnd >= source.length) return null

  const contentStart = getNextLineStart(source, openingLineEnd)
  let lineStart = contentStart

  while (lineStart < source.length) {
    const lineEnd = getLineEndIndex(source, lineStart)
    const line = stripTrailingCarriageReturn(source.slice(lineStart, lineEnd))

    if (FRONT_MATTER_CLOSE_DELIMITER_PATTERN.test(line)) {
      const bodyStart = getNextLineStart(source, lineEnd)
      return {
        yaml: source.slice(contentStart, lineStart),
        body: source.slice(bodyStart),
        sourcePrefix: source.slice(0, bodyStart),
        yamlStart: contentStart,
        yamlEnd: lineStart,
      }
    }

    lineStart = getNextLineStart(source, lineEnd)
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exceedsMaxDepth(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (typeof value !== 'object' || value === null) return false
  if (depth >= MAX_FRONT_MATTER_DEPTH) return true
  if (seen.has(value)) return true

  seen.add(value)

  const children = Array.isArray(value) ? value : Object.values(value)
  return children.some((child) => exceedsMaxDepth(child, depth + 1, seen))
}

function stringifyComplexValue(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function stringifyListItem(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return stringifyComplexValue(value)
}

function toDisplayValue(key: string, value: unknown): FrontMatterDisplayValue {
  if (value === null || value === undefined || value === '') return { type: 'empty' }

  if (typeof value === 'boolean') return { type: 'boolean', value }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return { type: 'number', value: String(value) }
  }
  if (typeof value === 'string') return { type: 'text', value }

  if (Array.isArray(value)) {
    const items = value.map(stringifyListItem).filter((item) => item.length > 0)
    if (items.length === 0) return { type: 'empty' }
    return { type: 'list', items, isTagList: key.toLowerCase() === 'tags' }
  }

  if (isRecord(value)) {
    return {
      type: 'object',
      entries: Object.entries(value).map(([entryKey, entryValue]) => ({
        key: entryKey,
        value: toDisplayValue(entryKey, entryValue),
      })),
    }
  }

  return { type: 'text', value: stringifyComplexValue(value) }
}

function toFrontMatterData(value: unknown): FrontMatterData | null {
  if (value === null || value === undefined) return { properties: [] }
  if (!isRecord(value)) return { properties: [] }
  if (exceedsMaxDepth(value)) return null

  const properties = Object.entries(value).map(([key, propertyValue]) => ({
    key,
    value: toDisplayValue(key, propertyValue),
  }))

  return { properties }
}

/**
 * Returns Markdown content without a valid top-of-file YAML front matter block.
 * @param markdown - Raw Markdown source that may start with YAML front matter.
 * @returns Markdown body when front matter parses safely, otherwise the original source.
 */
export function getMarkdownBody(markdown: string): string {
  return extractFrontMatter(markdown)?.body ?? markdown
}

function renderPropertyValue(
  key: string,
  value: FrontMatterDisplayValue,
  options: { interactiveBooleans: boolean }
): string {
  if (value.type === 'empty') {
    return '<span class="front-matter-empty">Empty</span>'
  }

  if (value.type === 'boolean') {
    if (!options.interactiveBooleans) {
      return `<span class="front-matter-value-text">${value.value ? 'true' : 'false'}</span>`
    }

    const checkedAttribute = value.value ? ' checked=""' : ''
    const escapedKey = escapeHtml(key)
    const label = value.value ? 'true' : 'false'
    return `<span class="front-matter-boolean"><input type="checkbox" class="front-matter-boolean-input" data-front-matter-key="${escapedKey}"${checkedAttribute} aria-label="Toggle ${escapedKey}"><span class="front-matter-boolean-label">${label}</span></span>`
  }

  if (value.type === 'list') {
    const chipClass = value.isTagList ? 'front-matter-chip front-matter-tag' : 'front-matter-chip'
    const items = value.items
      .map((item) => `<span class="${chipClass}">${escapeHtml(item)}</span>`)
      .join('')

    return `<span class="front-matter-list">${items}</span>`
  }

  if (value.type === 'object') {
    if (value.entries.length === 0) return '<span class="front-matter-empty">Empty</span>'

    const rows = value.entries
      .map(
        (entry) =>
          `<tr class="front-matter-nested-row"><th class="front-matter-nested-key">${escapeHtml(entry.key)}</th><td class="front-matter-nested-value">${renderPropertyValue(entry.key, entry.value, { interactiveBooleans: false })}</td></tr>`
      )
      .join('')

    return `<table class="front-matter-nested-table"><tbody>${rows}</tbody></table>`
  }

  return `<span class="front-matter-value-text">${escapeHtml(value.value)}</span>`
}

/**
 * Extracts YAML front matter from the top of a Markdown document.
 * @param markdown - Raw Markdown source that may start with a YAML front matter block.
 * @returns Parsed front matter and Markdown body, or `null` when no safe block is present.
 */
export function extractFrontMatter(markdown: string): FrontMatterParseResult | null {
  const block = extractFrontMatterBlock(markdown)
  if (!block) return null
  if (getUtf8ByteLength(block.yaml) > MAX_FRONT_MATTER_BYTES) return null

  try {
    const parsed = parse(block.yaml, {
      version: '1.2',
      schema: 'core',
      merge: false,
      resolveKnownTags: false,
      customTags: null,
      stringKeys: true,
      uniqueKeys: true,
    }) as unknown
    const frontMatter = toFrontMatterData(parsed)
    if (!frontMatter) return null

    return {
      frontMatter,
      body: block.body,
      sourcePrefix: block.sourcePrefix,
    }
  } catch {
    return null
  }
}

/**
 * Renders parsed front matter as escaped, read-only properties HTML.
 * @param frontMatter - Parsed front matter data to render.
 * @returns HTML string for the metadata properties panel.
 */
export function renderFrontMatterHtml(frontMatter: FrontMatterData): string {
  if (frontMatter.properties.length === 0) return ''

  const rows = frontMatter.properties
    .map(
      (property) =>
        `<tr class="front-matter-row"><th class="front-matter-key">${escapeHtml(property.key)}</th><td class="front-matter-value">${renderPropertyValue(property.key, property.value, { interactiveBooleans: true })}</td></tr>`
    )
    .join('')

  return `<section class="front-matter-properties" aria-label="Document properties"><table><tbody>${rows}</tbody></table></section>`
}

const YAML_BOOLEAN_LITERAL_PATTERN_SOURCE = '(true|True|TRUE|false|False|FALSE)'

function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function preserveBooleanCase(currentLiteral: string, nextValue: boolean): string {
  const literal = nextValue ? 'true' : 'false'
  if (currentLiteral === currentLiteral.toUpperCase()) return literal.toUpperCase()
  if (currentLiteral[0] === currentLiteral[0].toUpperCase()) {
    return literal[0].toUpperCase() + literal.slice(1)
  }
  return literal
}

/**
 * Toggles a top-level boolean value in the YAML front matter block.
 *
 * Matches the common shape `key: <bool>` (optionally followed by a YAML inline
 * comment introduced by whitespace + `#`). Returns the original source unchanged
 * when the key is not a top-level scalar boolean written on a single line: that
 * includes quoted keys (`"draft": false`), anchored scalars (`draft: &flag false`),
 * explicit-key form (`? draft\n: false`), next-line scalars (`draft:\n  false`),
 * and any non-top-level (indented) match.
 *
 * @param markdown - Source markdown that may begin with a YAML front matter block.
 * @param key - Top-level key whose boolean value should be set.
 * @param nextValue - The next boolean state to write.
 * @returns Markdown with the boolean updated, or the original source if the key cannot be safely toggled.
 */
export function toggleFrontMatterBoolean(
  markdown: string,
  key: string,
  nextValue: boolean
): string {
  if (!markdown || !key) return markdown
  const block = extractFrontMatterBlock(markdown)
  if (!block) return markdown

  const escapedKey = escapeRegExpLiteral(key)
  const pattern = new RegExp(
    `^(${escapedKey}[ \\t]*:[ \\t]+)${YAML_BOOLEAN_LITERAL_PATTERN_SOURCE}((?:[ \\t]+#[^\\n]*)?[ \\t]*)$`,
    'm'
  )

  let didReplace = false
  const updatedYaml = block.yaml.replace(pattern, (_match, prefix, current, suffix) => {
    didReplace = true
    return `${prefix}${preserveBooleanCase(current, nextValue)}${suffix}`
  })

  if (!didReplace || updatedYaml === block.yaml) return markdown
  return markdown.slice(0, block.yamlStart) + updatedYaml + markdown.slice(block.yamlEnd)
}
