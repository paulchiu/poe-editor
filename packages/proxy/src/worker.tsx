import { ImageResponse } from '@cf-wasm/og'
import { createElement } from 'react'

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
function parsePathMetadata(pathname: string): { title: string; snippet: string } | null {
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
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * HTMLRewriter element content handlers interface
 */
interface ElementContentHandlers {
  element?(element: Element): void | Promise<void>
  comments?(comment: Comment): void | Promise<void>
  text?(text: Text): void | Promise<void>
}

/**
 * Handler to remove existing meta tags
 */
export const removeElementHandler = {
  element(element: Element): void {
    element.remove()
  },
}

/**
 * Creates an HTMLRewriter handler for the <head> element to inject OG meta tags
 * @param title - The page title
 * @param snippet - The page snippet/description
 * @param ogImageUrl - The OG image URL
 * @param url - The current page URL
 * @returns Element handler object for HTMLRewriter
 */
export function createHeadHandler(
  title: string,
  snippet: string,
  ogImageUrl: string,
  url: string
): ElementContentHandlers {
  const origin = new URL(url).origin
  return {
    element(element: Element): void {
      const metaTags = `
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(snippet)}" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Poe Markdown Editor" />
<meta property="og:logo" content="${origin}/favicon.svg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(snippet)}" />
<meta name="twitter:image" content="${ogImageUrl}" />
<meta name="twitter:url" content="${url}" />
<meta name="description" content="${escapeHtml(snippet)}" />
`
      element.prepend(metaTags, { html: true })
    },
  }
}

/**
 * Creates an HTMLRewriter handler for the <title> element
 * @param title - The page title
 * @returns Element handler object for HTMLRewriter
 */
function createTitleHandler(title: string): ElementContentHandlers {
  return {
    element(element: Element): void {
      element.setInnerContent(title)
    },
  }
}

// Font cache to avoid re-fetching
const fontCache: Map<string, ArrayBuffer> = new Map()

async function loadFont(url: string): Promise<ArrayBuffer> {
  if (fontCache.has(url)) {
    return fontCache.get(url)!
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`)
  }

  const fontBuffer = await response.arrayBuffer()
  fontCache.set(url, fontBuffer)
  return fontBuffer
}

/**
 * Generates an OG image using ImageResponse
 * @param title - The title text
 * @param snippet - The snippet text
 * @returns ImageResponse object
 */
async function generateOgImage(title: string, snippet: string): Promise<Response> {
  // Load fonts
  // Note: ImageResponse handles font loading, but caching locally is good practice
  const interFontUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff'
  const interBoldUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'

  const [interFont, interBold] = await Promise.all([loadFont(interFontUrl), loadFont(interBoldUrl)])

  // Truncate texts for display
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title
  const displaySnippet = snippet.length > 150 ? snippet.slice(0, 147) + '...' : snippet

  // Create the OG image layout
  const element = createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1b', // Reddit-style dark gray
        width: '1200px',
        height: '630px',
        padding: '60px',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box',
      },
    },
    // Header with logo
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px',
        },
      },
      createElement(
        'span',
        {
          style: {
            fontSize: '24px',
            color: '#818384',
            fontWeight: 400,
          },
        },
        'poemd.dev'
      )
    ),
    // Title
    createElement(
      'h1',
      {
        style: {
          fontSize: '72px',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 32px 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          maxWidth: '100%',
        },
      },
      displayTitle
    ),
    // Snippet
    createElement(
      'p',
      {
        style: {
          fontSize: '32px',
          fontWeight: 400,
          color: '#818384',
          margin: '0',
          lineHeight: '1.4',
          maxWidth: '100%',
        },
      },
      displaySnippet
    )
  )

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: interFont,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: interBold,
        weight: 700,
        style: 'normal',
      },
    ],
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

// ... (imports remain)

export interface Env {
  OG_SECRET?: string
}

/**
 * Gets the secret for HMAC signing
 * Defaults to a development secret if not configured
 * @param env - The environment variables object
 * @returns The secret string for signing
 */
function getSecret(env: Env): string {
  return env.OG_SECRET || 'development-secret'
}

/**
 * Generates an HMAC SHA-256 signature for the given parameters
 * @param title - The document title to sign
 * @param snippet - The document snippet to sign
 * @param secret - The secret key for signing
 * @returns A hex-encoded HMAC SHA-256 signature
 */
async function generateSignature(title: string, snippet: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const data = JSON.stringify({ title, snippet })
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies the signature matches the parameters
 * @param title - The document title to verify
 * @param snippet - The document snippet to verify
 * @param signature - The signature to verify
 * @param secret - The secret key for verification
 * @returns True if the signature is valid, false otherwise
 */
async function verifySignature(
  title: string,
  snippet: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(title, snippet, secret)
  return signature === expectedSignature
}

// ... (existing helper functions: isStaticAsset, parsePathMetadata, escapeHtml)

// ... (existing createHeadHandler, createTitleHandler)

// ... (existing font loading and generateOgImage)

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Handle /api/og endpoint
    if (pathname === '/api/og') {
      const title = url.searchParams.get('title') || 'Untitled'
      const snippet = url.searchParams.get('snippet') || 'A document on poemd.dev'
      const signature = url.searchParams.get('sig')

      // Verify signature
      const secret = getSecret(env)
      const isValid = signature && (await verifySignature(title, snippet, signature, secret))

      if (!isValid) {
        return new Response('Unauthorized: Invalid or missing signature', { status: 401 })
      }

      try {
        return await generateOgImage(title, snippet)
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Failed to generate image',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    }

    // Check if this is a static asset - pass through unchanged
    if (isStaticAsset(pathname)) {
      return fetch(request)
    }

    // Check for metadata path (exactly 2 segments)
    const metadata = parsePathMetadata(pathname)

    if (metadata) {
      // This is a dynamic route with title/snippet
      // Fetch the index.html and inject OG meta tags
      const indexUrl = new URL('/index.html', url.origin)
      const indexResponse = await fetch(indexUrl.toString())

      if (!indexResponse.ok) {
        return fetch(request)
      }

      // Generate OG image URL with signature
      const secret = getSecret(env)
      const signature = await generateSignature(metadata.title, metadata.snippet, secret)

      const ogImageUrl = new URL('/api/og', url.origin)
      ogImageUrl.searchParams.set('title', metadata.title)
      ogImageUrl.searchParams.set('snippet', metadata.snippet)
      ogImageUrl.searchParams.set('sig', signature)

      // Rewrite HTML to inject meta tags
      const rewriter = new HTMLRewriter()
        .on(
          'head',
          createHeadHandler(metadata.title, metadata.snippet, ogImageUrl.toString(), url.toString())
        )
        .on('title', createTitleHandler(metadata.title))
        .on('meta[property^="og:"]', removeElementHandler)
        .on('meta[name^="twitter:"]', removeElementHandler)
        .on('meta[name="description"]', removeElementHandler)

      return rewriter.transform(indexResponse)
    }

    // For all other requests (root path, other routes), pass through to static assets
    return fetch(request)
  },
}
