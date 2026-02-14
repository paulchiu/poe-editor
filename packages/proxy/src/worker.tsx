// ... imports ...
import { type Env, parsePathMetadata } from './utils'
import { handleMetadataRoute } from './handlers'
import { createHeadHandler, removeElementHandler } from './rewriter'

export { createHeadHandler, removeElementHandler }

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    const metadata = parsePathMetadata(pathname)
    if (metadata) {
      return handleMetadataRoute(request, metadata)
    }

    return fetch(request)
  },
}
