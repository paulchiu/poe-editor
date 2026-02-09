import satori from 'satori'
import { initWasm as initResvg, Resvg } from '@resvg/resvg-wasm'
import initYoga from 'yoga-wasm-web'
import { createElement } from 'react'

// Import WASM modules - these will be handled by wrangler's CompiledWasm rule
import yogaWasm from 'yoga-wasm-web/dist/yoga.wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'

// Singleton pattern for WASM initialization
let isInitialized = false
let initializationPromise: Promise<void> | null = null

async function initialize(): Promise<void> {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      // Initialize Yoga layout engine
      await initYoga(yogaWasm)

      // Initialize Resvg for PNG rendering
      await initResvg(resvgWasm)

      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize WASM modules:', error)
      throw error
    }
  })()

  return initializationPromise
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
 * HTMLRewriter handler to inject OG meta tags
 */
class OpenGraphHandler {
  private title: string
  private snippet: string
  private ogImageUrl: string

  constructor(title: string, snippet: string, ogImageUrl: string) {
    this.title = title
    this.snippet = snippet
    this.ogImageUrl = ogImageUrl
  }

  element(element: Element) {
    // Inject OG meta tags in the <head>
    if (element.tagName === 'head') {
      const metaTags = `
<meta property="og:title" content="${this.escapeHtml(this.title)}" />
<meta property="og:description" content="${this.escapeHtml(this.snippet)}" />
<meta property="og:image" content="${this.ogImageUrl}" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${this.escapeHtml(this.title)}" />
<meta name="twitter:description" content="${this.escapeHtml(this.snippet)}" />
<meta name="twitter:image" content="${this.ogImageUrl}" />
<meta name="description" content="${this.escapeHtml(this.snippet)}" />
`
      element.prepend(metaTags, { html: true })
    }

    // Update the <title> tag
    if (element.tagName === 'title') {
      element.setInnerContent(this.title)
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

/**
 * Generates an OG image using Satori
 * @param title - The title text
 * @param snippet - The snippet text
 * @returns PNG image buffer
 */
async function generateOgImage(title: string, snippet: string): Promise<Uint8Array> {
  await initialize()

  // Load fonts
  const interFontUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff'
  const interBoldUrl =
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'
  const interFont = await loadFont(interFontUrl)
  const interBold = await loadFont(interBoldUrl)

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

  // Generate SVG using Satori
  const svg = await satori(element, {
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
  })

  // Render SVG to PNG using Resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })

  const pngData = resvg.render()
  return pngData.asPng()
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Env {
  // Environment variables can be added here if needed
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Handle /api/og endpoint
    if (pathname === '/api/og') {
      const title = url.searchParams.get('title') || 'Untitled'
      const snippet = url.searchParams.get('snippet') || 'A document on poemd.dev'

      try {
        const pngBuffer = await generateOgImage(title, snippet)

        return new Response(pngBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } catch (error) {
        console.error('Error generating OG image:', error)
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
      // Let the static assets handler deal with it
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
        // If index.html doesn't exist, just pass through
        return fetch(request)
      }

      // Generate OG image URL
      const ogImageUrl = new URL('/api/og', url.origin)
      ogImageUrl.searchParams.set('title', metadata.title)
      ogImageUrl.searchParams.set('snippet', metadata.snippet)

      // Rewrite HTML to inject meta tags
      const rewriter = new HTMLRewriter()
        .on('head', new OpenGraphHandler(metadata.title, metadata.snippet, ogImageUrl.toString()))
        .on('title', new OpenGraphHandler(metadata.title, metadata.snippet, ogImageUrl.toString()))

      return rewriter.transform(indexResponse)
    }

    // For all other requests (root path, other routes), pass through to static assets
    return fetch(request)
  },
}
