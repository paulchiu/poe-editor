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

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    const metadata = parsePathMetadata(pathname)
    if (metadata) {
      return handleMetadataRoute(request, metadata, env)
    }

    return proxyToOrigin(request, env)
  },
}
