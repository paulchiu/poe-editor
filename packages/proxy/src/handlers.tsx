import { type Env, getSecret, isDevelopment } from './utils'
import { generateSignature, verifySignature } from './crypto'
import { generateOgImage } from './og'
import { createPerfTracer } from './perf'
import { createHeadHandler, createTitleHandler, removeElementHandler } from './rewriter'

/**
 * Handles the /api/og endpoint
 */
export async function handleApiOg(request: Request, env: Env): Promise<Response> {
  const perf = createPerfTracer('handleApiOg')

  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'Untitled'
  const snippet = url.searchParams.get('snippet') || 'A document on poemd.dev'
  const platform = url.searchParams.get('platform')
  const signature = url.searchParams.get('sig')

  const secret = getSecret(env)
  const isHome = platform === 'home'
  const isValid =
    isHome || (signature && (await verifySignature(title, snippet, platform, signature, secret)))
  perf.mark('verifySignature')

  if (!isValid) {
    return new Response('Unauthorized: Invalid or missing signature', { status: 401 })
  }

  // Optimize: In production, for home page, redirect to static asset
  if (isHome && !isDevelopment(env)) {
    return Response.redirect(`${url.origin}/og-home.png`, 307)
  }

  try {
    const response = await generateOgImage(title, snippet, platform)
    perf.mark('generateOgImage')
    console.warn(perf.summary())
    return response
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
export async function handleHome(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const indexResponse = await fetch(request.url)
  if (!indexResponse.ok) return fetch(request)

  if (!isDevelopment(env)) {
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
export async function handleMetadataRoute(
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
