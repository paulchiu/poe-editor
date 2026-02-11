import satori, { init as initSatori } from 'satori/wasm'
import { initWasm as initResvg, Resvg } from '@resvg/resvg-wasm'
import initYoga from 'yoga-wasm-web'
import { createElement } from 'react'

// Import WASM modules - handled by wrangler's CompiledWasm rule
import yogaWasm from 'yoga-wasm-web/dist/yoga.wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'

// Singleton pattern for WASM initialization
let isInitialized = false
let initializationPromise: Promise<void> | null = null

function requireWasmModule(value: unknown, name: string): WebAssembly.Module {
  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly is not available in this runtime.')
  }

  if (value instanceof WebAssembly.Module) {
    return value
  }

  const valueType =
    value && typeof value === 'object' && 'constructor' in value && value.constructor
      ? value.constructor.name
      : typeof value

  throw new Error(
    `${name} must be a compiled WebAssembly.Module (got ${valueType}). ` +
      'Ensure wrangler.toml enables CompiledWasm for *.wasm imports.'
  )
}

function resolveWasmModules(env: Env): { yoga: WebAssembly.Module; resvg: WebAssembly.Module } {
  const yogaModule = env.YOGA_WASM ?? yogaWasm
  const resvgModule = env.RESVG_WASM ?? resvgWasm

  return {
    yoga: requireWasmModule(yogaModule, 'YOGA_WASM'),
    resvg: requireWasmModule(resvgModule, 'RESVG_WASM'),
  }
}

async function initialize(env: Env): Promise<void> {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      const { yoga: yogaModule, resvg: resvgModule } = resolveWasmModules(env)

      // Initialize Yoga layout engine
      const yoga = await initYoga(yogaModule)
      initSatori(yoga)

      // Initialize Resvg for PNG rendering
      await initResvg(resvgModule)

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
 * Creates an HTMLRewriter handler for the <head> element to inject OG meta tags
 * @param title - The page title
 * @param snippet - The page snippet/description
 * @param ogImageUrl - The OG image URL
 * @returns Element handler object for HTMLRewriter
 */
function createHeadHandler(
  title: string,
  snippet: string,
  ogImageUrl: string
): ElementContentHandlers {
  return {
    element(element: Element): void {
      const metaTags = `
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(snippet)}" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(snippet)}" />
<meta name="twitter:image" content="${ogImageUrl}" />
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

/**
 * Generates an OG image using Satori
 * @param title - The title text
 * @param snippet - The snippet text
 * @param env - Worker environment with compiled WASM modules
 * @returns PNG image buffer
 */
async function generateOgImage(title: string, snippet: string, env: Env): Promise<Uint8Array> {
  await initialize(env)

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

export interface Env {
  YOGA_WASM?: WebAssembly.Module
  RESVG_WASM?: WebAssembly.Module
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
        const pngBuffer = await generateOgImage(title, snippet, env)

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
        .on('head', createHeadHandler(metadata.title, metadata.snippet, ogImageUrl.toString()))
        .on('title', createTitleHandler(metadata.title))

      return rewriter.transform(indexResponse)
    }

    // For all other requests (root path, other routes), pass through to static assets
    return fetch(request)
  },
}
