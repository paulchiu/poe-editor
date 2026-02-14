
import { Env, isStaticAsset, parsePathMetadata } from './utils'
import { handleApiOg, handleHome, handleMetadataRoute } from './handlers'
import { createHeadHandler, removeElementHandler } from './rewriter'

export { createHeadHandler, removeElementHandler }

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    console.log('Env keys:', Object.keys(env))
    const url = new URL(request.url)
    const { pathname } = url

    // Pattern matching style routing
    if (pathname === '/api/og') {
      return handleApiOg(request, env)
    }

    // Serve namespaced proxy assets
    if (pathname.startsWith('/proxy/')) {
      // Try serving from Workers Assets first (production)
      let response = await env.ASSETS?.fetch(request)

      // Fallback to R2 bucket (remote dev or missing asset)
      if ((!response || response.status === 404) && env.STATIC_BUCKET) {
        const object = await env.STATIC_BUCKET.get(pathname.slice(1)) // Remove leading slash
        if (object) {
          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set('etag', object.httpEtag)

          return new Response(object.body, {
            headers,
          })
        }
      }

      if (response) {
        return response
      }
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
