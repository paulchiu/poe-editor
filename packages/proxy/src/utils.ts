
// Static asset patterns to exclude from OG handling
const STATIC_ASSET_PATTERNS = [
  /\.js$/i,
  /\.css$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.ico$/i,
  /\.woff2?$/i,
  /\.ttf$/i,
  /\.json$/i,
  /^\/favicon\.ico$/i,
  /^\/manifest\.json$/i,
  /^\/robots\.txt$/i,
]

export interface Env {
  OG_SECRET?: string
  ENVIRONMENT?: string
}

/**
 * Checks if the current environment is development
 * @param env - The environment variables object
 * @returns true if running in development (env.ENVIRONMENT === 'development')
 */
export function isDevelopment(env?: Env): boolean {
  return env?.ENVIRONMENT === 'development'
}

/**
 * Checks if a path is a static asset that should pass through unchanged
 * @param path - The URL pathname
 * @returns true if it's a static asset
 */
export function isStaticAsset(path: string): boolean {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Parses metadata from URL path segments
 * Format: /:title/:snippet
 * @param pathname - The URL pathname
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

/**
 * Gets the secret for HMAC signing
 * Defaults to a development secret if not configured
 * @param env - The environment variables object
 * @returns The secret string for signing
 */
export function getSecret(env: Env): string {
  return env.OG_SECRET || 'development-secret'
}
