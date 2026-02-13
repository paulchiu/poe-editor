
import { Env, isStaticAsset, parsePathMetadata } from './utils'
import { handleApiOg, handleHome, handleMetadataRoute } from './handlers'
import { createHeadHandler, removeElementHandler } from './rewriter'

export { createHeadHandler, removeElementHandler }

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
