import { type Env, parsePathMetadata } from './utils'
import { handleMetadataRoute } from './handlers'
import { createHeadHandler, removeElementHandler } from './rewriter'

export { createHeadHandler, removeElementHandler }

/**
 * Proxies a request to the origin, using ORIGIN_URL env var if set
 * @param request - The original request
 * @param env - Worker environment bindings
 * @returns Proxied response
 */
function proxyToOrigin(request: Request, env: Env): Promise<Response> {
  if (env.ORIGIN_URL) {
    const url = new URL(request.url)
    const originUrl = new URL(url.pathname + url.search, env.ORIGIN_URL)
    return fetch(originUrl.toString())
  }
  return fetch(request)
}

/**
 * Reads and normalizes the optional hero image URL from query params
 * @param url - Incoming request URL
 * @returns Absolute hero image URL, or undefined if missing/invalid
 */
function parseHeroImageUrl(url: URL): string | undefined {
  const hero = url.searchParams.get('hero')
  if (!hero) {
    return undefined
  }

  try {
    const parsedHeroUrl = new URL(hero, url.origin)
    if (parsedHeroUrl.protocol !== 'http:' && parsedHeroUrl.protocol !== 'https:') {
      return undefined
    }

    return parsedHeroUrl.toString()
  } catch {
    return undefined
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    const metadata = parsePathMetadata(pathname)
    if (metadata) {
      const heroImageUrl = parseHeroImageUrl(url)
      return handleMetadataRoute(request, { ...metadata, heroImageUrl }, env)
    }

    return proxyToOrigin(request, env)
  },
}
