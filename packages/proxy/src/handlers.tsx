import type { Env } from './utils'
import { createHeadHandler, createTitleHandler, removeElementHandler } from './rewriter'

/**
 * Fetches a URL, using ORIGIN_URL env var as base if set
 * @param url - The URL to fetch
 * @param env - Worker environment bindings
 * @returns Fetch response
 */
function fetchFromOrigin(url: string, env: Env): Promise<Response> {
  if (env.ORIGIN_URL) {
    const parsed = new URL(url)
    const originUrl = new URL(parsed.pathname + parsed.search, env.ORIGIN_URL)
    return fetch(originUrl.toString())
  }
  return fetch(url)
}

/**
 * Handles the home page route
 * @param request - The incoming request
 * @param metadata - Parsed title and snippet from the path
 * @param env - Worker environment bindings
 * @returns Rewritten HTML response with OG meta tags
 */
export async function handleMetadataRoute(
  request: Request,
  metadata: { title: string; snippet: string },
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const indexUrl = new URL('/index.html', url.origin)
  const indexResponse = await fetchFromOrigin(indexUrl.toString(), env)

  if (!indexResponse.ok) {
    return fetchFromOrigin(request.url, env)
  }

  const rewriter = new HTMLRewriter()
    .on('head', createHeadHandler(metadata.title, metadata.snippet, url.toString()))
    .on('title', createTitleHandler(metadata.title))
    .on('meta[property="og:title"]', removeElementHandler)
    .on('meta[property="og:description"]', removeElementHandler)
    .on('meta[property="og:type"]', removeElementHandler)
    .on('meta[property="og:url"]', removeElementHandler)
    .on('meta[property="og:site_name"]', removeElementHandler)
    .on('meta[name="twitter:card"]', removeElementHandler)
    .on('meta[name="twitter:title"]', removeElementHandler)
    .on('meta[name="twitter:description"]', removeElementHandler)
    .on('meta[name="twitter:url"]', removeElementHandler)
    .on('meta[name="description"]', removeElementHandler)

  return rewriter.transform(indexResponse)
}
