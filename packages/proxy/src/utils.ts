export interface Env {
  ORIGIN_URL?: string
}

/** Static asset patterns to exclude from metadata handling */
const STATIC_ASSET_PATTERNS = [
  /\.\w+$/i, // Any path with a file extension
  /^\/favicon\.ico$/i,
  /^\/manifest\.json$/i,
  /^\/robots\.txt$/i,
]

/**
 * Checks if a path is a static asset that should pass through unchanged
 * @param path - The URL pathname
 * @returns true if it's a static asset
 */
function isStaticAsset(path: string): boolean {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Parses metadata from URL path segments
 * Format: /:title/:snippet
 * @param pathname - The URL pathname
 * @returns Object with title and snippet, or null if invalid
 */
export function parsePathMetadata(pathname: string): { title: string; snippet: string } | null {
  if (isStaticAsset(pathname)) return null

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

/**
 * Escapes HTML special characters
 * @param text - The text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
