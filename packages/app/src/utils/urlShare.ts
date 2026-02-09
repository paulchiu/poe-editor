import { getFirstHeading } from '@/utils/markdown'
import { extractFirstEmoji } from '@/utils/emoji'

/**
 * Extracts a snippet from content (first non-heading line, truncated)
 * @param content - The markdown content
 * @param maxLength - Maximum length of snippet (default: 80)
 * @returns The extracted snippet
 */
export function extractSnippet(content: string, maxLength = 80): string {
  const lines = content.split('\n')

  // Find first non-empty, non-heading line
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip empty lines and headings
    if (!trimmed || trimmed.startsWith('#')) continue

    // Clean up the text: remove markdown syntax
    const cleaned = trimmed
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images first: ![alt](url) -> ''
      .replace(/\*\*/g, '') // Bold
      .replace(/\*/g, '') // Italic
      .replace(/`/g, '') // Code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links: [text](url) -> text

    if (cleaned) {
      // Truncate if too long
      if (cleaned.length > maxLength) {
        return cleaned.slice(0, maxLength - 3) + '...'
      }
      return cleaned
    }
  }

  return 'A document on poemd.dev'
}

/**
 * URL-encodes a string for use in path segments, preserving dashes for readability
 * @param text - The text to encode
 * @returns URL-encoded path segment
 */
export function encodePathSegment(text: string): string {
  // First, clean the text: remove special chars, replace spaces with dashes
  const cleaned = text
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except dashes and spaces
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .toLowerCase()

  // URL encode the result
  return encodeURIComponent(cleaned)
}

/**
 * Generates a shareable URL with metadata in path segments
 * Format: /:title/:snippet#<content-hash>
 * @param content - The document content
 * @param documentName - The document name
 * @param hash - The compressed content hash
 * @returns The full shareable URL
 */
export function generateShareableUrl(content: string, documentName: string, hash: string): string {
  // Extract title from first heading or use document name
  let title = getFirstHeading(content)
  if (!title) {
    title = documentName.replace(/\.md$/, '')
  } else {
    // Remove emoji from title for the URL
    const emoji = extractFirstEmoji(title)
    if (emoji) {
      title = title.replace(emoji, '').trim()
    }
  }

  // Extract snippet from content
  const snippet = extractSnippet(content)

  // Encode path segments
  const encodedTitle = encodePathSegment(title)
  const encodedSnippet = encodePathSegment(snippet)

  // Build the URL
  const baseUrl = window.location.origin
  const path = `/${encodedTitle}/${encodedSnippet}`
  const fullHash = hash ? `#${hash}` : ''

  return `${baseUrl}${path}${fullHash}`
}

/**
 * Parses metadata from URL path segments
 * @param pathname - The URL pathname (e.g., /Title/Snippet)
 * @returns Object with title and snippet, or null if invalid
 */
export function parsePathMetadata(pathname: string): { title: string; snippet: string } | null {
  const segments = pathname.split('/').filter(Boolean)

  // Must have exactly 2 segments for metadata
  if (segments.length !== 2) return null

  try {
    const [encodedTitle, encodedSnippet] = segments
    const title = decodeURIComponent(encodedTitle).replace(/-/g, ' ')
    const snippet = decodeURIComponent(encodedSnippet).replace(/-/g, ' ')

    return { title, snippet }
  } catch {
    return null
  }
}
