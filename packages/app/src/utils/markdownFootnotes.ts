import type { MarkdownIt } from 'markdown-it'

interface FootnoteDefinition {
  index: number
  label: string
  content: string
}

export interface ParsedFootnotes {
  markdown: string
  definitions: FootnoteDefinition[]
  referencesByLabel: Map<string, string[]>
}

/**
 * Parses footnote definitions and rewrites footnote references to HTML anchors.
 * @param markdown - Raw markdown input.
 * @returns Markdown with rendered references and collected definition metadata.
 */
export function parseFootnotes(markdown: string): ParsedFootnotes {
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

/**
 * Renders parsed footnote definitions into HTML appended after markdown content.
 * @param definitions - Ordered footnote definitions.
 * @param referencesByLabel - Reference ids grouped by label.
 * @param markdownRenderer - Markdown renderer for definition body content.
 * @returns Rendered footnotes HTML (or empty string when no definitions exist).
 */
export function renderFootnotes(
  definitions: ParsedFootnotes['definitions'],
  referencesByLabel: ParsedFootnotes['referencesByLabel'],
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
