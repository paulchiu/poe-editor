import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
}).use(highlightjs)

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
