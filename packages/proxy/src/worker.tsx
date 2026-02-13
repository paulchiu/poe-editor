import { ImageResponse } from '@cf-wasm/og'
import { createElement } from 'react'
import { SPLASH_IMAGE_BASE64 } from './assets'

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
 * Checks if the current environment is development
 * @param url - The current request URL
 * @returns true if running in development (localhost or 127.0.0.1)
 */
function isDevelopment(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

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
 * @param ogImageUrl - The standard OG image URL
 * @param twitterOgImageUrl - The Twitter-specific OG image URL
 * @param url - The current page URL
 * @returns Element handler object for HTMLRewriter
 */
export function createHeadHandler(
  title: string,
  snippet: string,
  ogImageUrl: string,
  twitterOgImageUrl: string,
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
<meta name="twitter:image" content="${twitterOgImageUrl}" />
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
 * @param platform - The platform variant (home, twitter, or undefined)
 * @param origin - The origin URL for fetching assets
 * @returns ImageResponse object
 */
async function generateOgImage(
  title: string,
  snippet: string,
  platform: string | null,
  origin: string
): Promise<Response> {
  // Common fonts
  const interFontUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff'
  const interBoldUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'

  // Home Page Design
  if (platform === 'home') {
    const playfairRegularUrl =
      'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.woff'
    const playfairBlackUrl =
      'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-900-normal.woff'
    const playfairItalicUrl =
      'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-italic.woff'

    const [playfairRegular, playfairBlack, playfairItalic] = await Promise.all([
      loadFont(playfairRegularUrl),
      loadFont(playfairBlackUrl),
      loadFont(playfairItalicUrl),
    ])

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '1200px',
            height: '630px',
            overflow: 'hidden',
            backgroundColor: '#050508',
            color: 'white',
            fontFamily: '"Playfair Display"',
          }}
        >
          {/* Background Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(to bottom right, #1a1610, #0c0a08, #000000)',
            }}
          />

          {/* Ghostly Illustration */}
          <div
            style={{
              position: 'absolute',
              right: '-50px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '700px',
              height: '700px',
              opacity: 0.25,
              display: 'flex',
            }}
          >
            {/* Using img tag with embedded base64 data URI */}
            <img
              src={SPLASH_IMAGE_BASE64}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Content Container */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              paddingLeft: '96px', // px-24
              maxWidth: '800px',
            }}
          >
            {/* Main Title Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1
                style={{
                  fontSize: '130px',
                  lineHeight: '0.9',
                  fontWeight: 900,
                  color: 'white',
                  margin: 0,
                }}
              >
                Poe
              </h1>
              <h2
                style={{
                  fontSize: '48px', // text-5xl
                  fontWeight: 300, // light
                  color: '#d1d5db', // gray-300
                  marginTop: '8px',
                  letterSpacing: '0.025em', // wide
                  margin: '8px 0 0 0',
                }}
              >
                Markdown Editor
              </h2>
            </div>

            {/* Decorative Divider */}
            <div
              style={{
                height: '2px',
                width: '128px', // w-32
                backgroundColor: '#9B2335',
                marginTop: '40px',
                marginBottom: '40px',
                boxShadow: '0 0 10px rgba(155,35,53,0.45)',
              }}
            />

            {/* Tagline */}
            <p
              style={{
                fontSize: '36px', // text-4xl
                fontStyle: 'italic',
                color: 'rgba(155, 35, 53, 0.75)',
                fontWeight: 300,
                letterSpacing: '0.025em',
                margin: 0,
              }}
            >
              Modal editing for Markdown
            </p>

            {/* Footer / URL */}
            <div
              style={{
                position: 'absolute',
                bottom: '48px', // bottom-12
                left: '96px', // left-24
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280', // gray-500
              }}
            >
              <span
                style={{
                  fontSize: '20px', // text-xl
                  letterSpacing: '0.1em', // widest
                  fontWeight: 600,
                  opacity: 0.6,
                }}
              >
                poemd.dev
              </span>
            </div>
          </div>

          {/* Border Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: playfairRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Playfair Display',
            data: playfairBlack,
            weight: 900,
            style: 'normal',
          },
          {
            name: 'Playfair Display',
            data: playfairItalic,
            weight: 400,
            style: 'italic',
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  }

  // Standard/Twitter Layout
  const [interFont, interBold] = await Promise.all([loadFont(interFontUrl), loadFont(interBoldUrl)])

  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title
  const displaySnippet = snippet.length > 150 ? snippet.slice(0, 147) + '...' : snippet

  const isTwitter = platform === 'twitter'
  const backgroundColor = isTwitter ? '#1D9BF0' : '#1a1a1b' // Twitter Blue or Dark Gray

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: backgroundColor,
          width: '1200px',
          height: '630px',
          padding: '60px',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
          color: 'white',
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              color: isTwitter ? 'rgba(255, 255, 255, 0.9)' : '#818384',
              fontWeight: 400,
            }}
          >
            poemd.dev
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 32px 0',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            maxWidth: '100%',
          }}
        >
          {displayTitle}
        </h1>

        {/* Snippet */}
        <p
          style={{
            fontSize: '32px',
            fontWeight: 400,
            color: isTwitter ? 'rgba(255, 255, 255, 0.9)' : '#818384',
            margin: '0',
            lineHeight: '1.4',
            maxWidth: '100%',
          }}
        >
          {displaySnippet}
        </p>
      </div>
    ),
    {
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
    }
  )
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
 * @param platform - The platform variant
 * @param secret - The secret key for signing
 * @returns A hex-encoded HMAC SHA-256 signature
 */
async function generateSignature(
  title: string,
  snippet: string,
  platform: string | null,
  secret: string
): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Include platform in the signature if it exists
  const data = JSON.stringify({ title, snippet, platform: platform || '' })
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
 * @param platform - The platform variant
 * @param signature - The signature to verify
 * @param secret - The secret key for verification
 * @returns True if the signature is valid, false otherwise
 */
async function verifySignature(
  title: string,
  snippet: string,
  platform: string | null,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(title, snippet, platform, secret)
  return signature === expectedSignature
}

// ... (existing helper functions: isStaticAsset, parsePathMetadata, escapeHtml)

// ... (existing createHeadHandler, createTitleHandler)

// ... (existing font loading and generateOgImage)

/**
 * Handles the /api/og endpoint
 */
async function handleApiOg(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'Untitled'
  const snippet = url.searchParams.get('snippet') || 'A document on poemd.dev'
  const platform = url.searchParams.get('platform')
  const signature = url.searchParams.get('sig')

  const secret = getSecret(env)
  const isHome = platform === 'home'
  const isValid =
    isHome || (signature && (await verifySignature(title, snippet, platform, signature, secret)))

  if (!isValid) {
    return new Response('Unauthorized: Invalid or missing signature', { status: 401 })
  }

  if (isHome && !isDevelopment(url)) {
    return Response.redirect(`${url.origin}/og-home.png`, 307)
  }

  try {
    return await generateOgImage(title, snippet, platform, url.origin)
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate image',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Handles the home page route
 */
async function handleHome(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const indexResponse = await fetch(request.url)
  if (!indexResponse.ok) return fetch(request)

  if (!isDevelopment(url)) {
    return indexResponse
  }

  const secret = getSecret(env)
  const homePlatform = 'home'
  const homeSignature = await generateSignature('Home', '', homePlatform, secret)

  const ogImageUrl = new URL('/api/og', url.origin)
  ogImageUrl.searchParams.set('title', 'Home')
  ogImageUrl.searchParams.set('snippet', '')
  ogImageUrl.searchParams.set('platform', homePlatform)
  ogImageUrl.searchParams.set('sig', homeSignature)

  const rewriter = new HTMLRewriter()
    .on(
      'head',
      createHeadHandler(
        'Poe Markdown Editor',
        'Modal editing for Markdown',
        ogImageUrl.toString(),
        ogImageUrl.toString(),
        url.toString()
      )
    )
    .on('meta[property^="og:"]', removeElementHandler)
    .on('meta[name^="twitter:"]', removeElementHandler)

  return rewriter.transform(indexResponse)
}

/**
 * Handles metadata routes (/:title/:snippet)
 */
async function handleMetadataRoute(
  request: Request,
  env: Env,
  metadata: { title: string; snippet: string }
): Promise<Response> {
  const url = new URL(request.url)
  const indexUrl = new URL('/index.html', url.origin)
  const indexResponse = await fetch(indexUrl.toString())

  if (!indexResponse.ok) {
    return fetch(request)
  }

  const secret = getSecret(env)

  // 1. Generate Standard OG Image
  const sigDefault = await generateSignature(metadata.title, metadata.snippet, null, secret)
  const ogImageUrl = new URL('/api/og', url.origin)
  ogImageUrl.searchParams.set('title', metadata.title)
  ogImageUrl.searchParams.set('snippet', metadata.snippet)
  ogImageUrl.searchParams.set('sig', sigDefault)

  // 2. Generate Twitter OG Image
  const sigTwitter = await generateSignature(metadata.title, metadata.snippet, 'twitter', secret)
  const twitterOgImageUrl = new URL('/api/og', url.origin)
  twitterOgImageUrl.searchParams.set('title', metadata.title)
  twitterOgImageUrl.searchParams.set('snippet', metadata.snippet)
  twitterOgImageUrl.searchParams.set('platform', 'twitter')
  twitterOgImageUrl.searchParams.set('sig', sigTwitter)

  const rewriter = new HTMLRewriter()
    .on(
      'head',
      createHeadHandler(
        metadata.title,
        metadata.snippet,
        ogImageUrl.toString(),
        twitterOgImageUrl.toString(),
        url.toString()
      )
    )
    .on('title', createTitleHandler(metadata.title))
    .on('meta[property^="og:"]', removeElementHandler)
    .on('meta[name^="twitter:"]', removeElementHandler)
    .on('meta[name="description"]', removeElementHandler)

  return rewriter.transform(indexResponse)
}


export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    // Pattern matching style routing
    if (pathname === '/api/og') {
      return handleApiOg(request, env)
    }

    if (isStaticAsset(pathname)) {
      return fetch(request)
    }

    if (pathname === '/') {
      return handleHome(request, env)
    }

    const metadata = parsePathMetadata(pathname)
    if (metadata) {
      return handleMetadataRoute(request, env, metadata)
    }

    return fetch(request)
  },

}
