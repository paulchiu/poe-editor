import type MarkdownIt from 'markdown-it'

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

/**
 * Collects ordered headings with stable slug ids from markdown content.
 * @param markdown - Raw markdown source.
 * @param parser - Markdown parser used for tokenization.
 * @returns Ordered heading metadata.
 */
export function collectHeadings(markdown: string, parser: MarkdownIt): TocHeading[] {
  const tokens = parser.parse(markdown, {})
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

/**
 * Applies heading ids to rendered heading elements in HTML order.
 * @param html - Rendered markdown HTML.
 * @param headings - Ordered heading metadata.
 * @returns HTML with heading ids assigned.
 */
export function applyHeadingIds(html: string, headings: TocHeading[]): string {
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

function generateTocHtml(headings: TocHeading[], parser: MarkdownIt): string {
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

    const escapedText = parser.utils.escapeHtml(heading.text)
    const escapedId = parser.utils.escapeHtml(heading.id)
    parts.push(`<li><a href="#${escapedId}">${escapedText}</a>`)
  }

  while (stack.length > 1) {
    parts.push('</li></ul>')
    stack.pop()
  }

  parts.push('</li></ul></div>')
  return parts.join('')
}

/**
 * Replaces `<!-- TOC -->` directives with generated table-of-contents HTML.
 * @param html - Rendered markdown HTML.
 * @param headings - Heading metadata source.
 * @param parser - Markdown parser for escaping helpers.
 * @returns HTML with TOC directives replaced.
 */
export function injectTocDirective(
  html: string,
  headings: TocHeading[],
  parser: MarkdownIt
): string {
  if (!/<!--\s*TOC\s*-->/.test(html)) return html
  return html.replace(/<!--\s*TOC\s*-->/g, generateTocHtml(headings, parser))
}

/**
 * Extracts the first heading text from markdown content.
 * @param markdown - Raw markdown source.
 * @param parser - Markdown parser used for tokenization.
 * @returns First heading text, or `null` when none exist.
 */
export function getFirstHeadingFromMarkdown(markdown: string, parser: MarkdownIt): string | null {
  if (!markdown) return null

  const tokens = parser.parse(markdown, {})

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type === 'heading_open') {
      const nextToken = tokens[index + 1]
      if (nextToken && nextToken.type === 'inline') {
        return nextToken.content
      }
    }
  }

  return null
}
