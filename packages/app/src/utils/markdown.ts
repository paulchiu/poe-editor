import type MarkdownIt from 'markdown-it'
import { sanitizeGithubSafeHtml } from '@/utils/githubSafeHtml'
import { createMarkdownIt, EMOJI_SHORTCODE_PATTERN } from '@/utils/markdownRenderers'
import { parseFootnotes, renderFootnotes } from '@/utils/markdownFootnotes'
import { renderGithubCallouts, renderTaskLists } from '@/utils/markdownPostProcessing'
import {
  applyHeadingIds,
  collectHeadings,
  getFirstHeadingFromMarkdown,
  injectTocDirective,
  type TocHeading,
} from '@/utils/markdownHeadings'

export type { TocHeading } from '@/utils/markdownHeadings'

type MarkdownItPlugin = (markdown: MarkdownIt) => void
type EmojiMarkdownModule = {
  full: MarkdownItPlugin
}
type EmojiMarkdownModuleLoader = () => Promise<EmojiMarkdownModule>

const baseMarkdown = createMarkdownIt(false)
const markdownRenderer = createMarkdownIt(true)

let emojiMarkdownRendererPromise: Promise<MarkdownIt> | null = null
const defaultEmojiMarkdownModuleLoader: EmojiMarkdownModuleLoader = async () =>
  (await import('markdown-it-emoji')) as EmojiMarkdownModule
let emojiMarkdownModuleLoader: EmojiMarkdownModuleLoader = defaultEmojiMarkdownModuleLoader

async function getEmojiMarkdownRenderer(): Promise<MarkdownIt> {
  if (!emojiMarkdownRendererPromise) {
    emojiMarkdownRendererPromise = (async () => {
      const { full } = await emojiMarkdownModuleLoader()
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

function renderMarkdownWithRenderer(markdown: string, renderer: MarkdownIt): string {
  if (!markdown) return ''

  const headings = collectHeadings(markdown, baseMarkdown)
  const {
    markdown: markdownWithReferences,
    definitions,
    referencesByLabel,
  } = parseFootnotes(markdown)

  const renderedBody = renderer.render(markdownWithReferences)
  const withHeadingIds = applyHeadingIds(renderedBody, headings)
  const withTocDirective = injectTocDirective(withHeadingIds, headings, baseMarkdown)
  const withFootnotes = `${withTocDirective}${renderFootnotes(definitions, referencesByLabel, renderer)}`
  const withGithubCallouts = renderGithubCallouts(withFootnotes)
  const withTaskLists = renderTaskLists(withGithubCallouts)
  return sanitizeGithubSafeHtml(withTaskLists)
}

/**
 * Gets table-of-contents headings from markdown.
 * @param markdown - Markdown source content.
 * @returns Ordered heading entries with stable ids.
 */
export function getTocHeadings(markdown: string): TocHeading[] {
  if (!markdown) return []
  return collectHeadings(markdown, baseMarkdown)
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
  return getFirstHeadingFromMarkdown(markdown, baseMarkdown)
}

/**
 * Overrides the lazy emoji module loader for isolated tests.
 * @param loader - Test loader to use, or `null` to restore the default loader.
 * @returns void
 */
export function setEmojiMarkdownModuleLoaderForTests(
  loader: EmojiMarkdownModuleLoader | null
): void {
  emojiMarkdownRendererPromise = null
  emojiMarkdownModuleLoader = loader ?? defaultEmojiMarkdownModuleLoader
}

/**
 * Resets the lazy emoji renderer cache and restores the default emoji loader for tests.
 * @returns void
 */
export function resetEmojiMarkdownRendererForTests(): void {
  emojiMarkdownRendererPromise = null
  emojiMarkdownModuleLoader = defaultEmojiMarkdownModuleLoader
}
