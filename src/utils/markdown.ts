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
