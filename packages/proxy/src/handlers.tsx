import { type Env } from './utils'
import { createHeadHandler, createTitleHandler, removeElementHandler } from './rewriter'

/**
 * Handles the home page route
 */
export async function handleMetadataRoute(
  request: Request,
  metadata: { title: string; snippet: string }
): Promise<Response> {
  const url = new URL(request.url)
  const indexUrl = new URL('/index.html', url.origin)
  const indexResponse = await fetch(indexUrl.toString())

  if (!indexResponse.ok) {
    return fetch(request)
  }

  const rewriter = new HTMLRewriter()
    .on(
      'head',
      createHeadHandler(
        metadata.title,
        metadata.snippet,
        url.toString()
      )
    )
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
