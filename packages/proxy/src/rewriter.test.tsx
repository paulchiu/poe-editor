import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'



interface WorkerModule {
  fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>
}



interface MockElement {
  remove(): void
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  before(content: string, options?: { html: boolean }): void
  after(content: string, options?: { html: boolean }): void
  replace(content: string, options?: { html: boolean }): void
  prepend(content: string, options?: { html: boolean }): void
  append(content: string, options?: { html: boolean }): void
  setInnerContent(content: string): void
  removeAndKeepContent(): void
}

interface MockHandler {
  element?: (element: MockElement) => void | Promise<void>
}

// Mock global HTMLRewriter with functional implementation
class MockHTMLRewriter {
  private handlers: Array<{ selector: string; handler: MockHandler }> = []

  on(selector: string, handler: MockHandler) {
    this.handlers.push({ selector, handler })
    return this
  }

  transform(response: Response): Response {
    // Clone response to read body
    const textPromise = response.text()
    const handlers = this.handlers

    return new Response(
      new ReadableStream({
        async start(controller) {
          let html = await textPromise

          // Simple mock implementation for testing
          // 1. Handle element removal
          // Note: This is a simplified implementation for specific test cases
          for (const { selector, handler } of handlers) {
            if (selector.includes('meta') && handler.element) {
              // It's likely the removeElementHandler which just calls remove()
              // We'll mock the element with a remove function
              const mockElement = {
                remove: () => {
                  // Remove matching tags
                  // Remove matching tags
                  if (selector.includes('property^="og:"')) {
                    html = html.replace(/<meta property="og:[^>]*>/g, '')
                  }
                  if (selector.includes('name^="twitter:"')) {
                    html = html.replace(/<meta name="twitter:[^>]*>/g, '')
                  }
                  if (selector.includes('name="description"')) {
                    html = html.replace(/<meta name="description"[^>]*>/g, '')
                  }

                  // Handle specific property selectors (e.g. meta[property="og:title"])
                  const propMatch = selector.match(/meta\[property="([^"]+)"\]/)
                  if (propMatch) {
                    const prop = propMatch[1]
                    html = html.replace(new RegExp(`<meta property="${prop}"[^>]*>`, 'g'), '')
                  }

                  // Handle specific name selectors (e.g. meta[name="twitter:title"])
                  const nameMatch = selector.match(/meta\[name="([^"]+)"\]/)
                  if (nameMatch) {
                    const name = nameMatch[1]
                    html = html.replace(new RegExp(`<meta name="${name}"[^>]*>`, 'g'), '')
                  }
                },
                getAttribute: () => null,
                setAttribute: () => {},
                before: () => {},
                after: () => {},
                replace: () => {},
                prepend: () => {},
                append: () => {},
                setInnerContent: () => {},
                removeAndKeepContent: () => {},
              }
              handler.element(mockElement)
            }
          }

          // 2. Handle head injection
          for (const { selector, handler } of handlers) {
            if (selector === 'head' && handler.element) {
              const mockElement = {
                prepend: (content: string, _options?: { html: boolean }) => {
                  html = html.replace('<head>', `<head>${content}`)
                },
                getAttribute: () => null,
                setAttribute: () => {},
                before: () => {},
                after: () => {},
                replace: () => {},
                remove: () => {},
                append: () => {},
                setInnerContent: () => {},
                removeAndKeepContent: () => {},
              }
              handler.element(mockElement)
            }
            // 3. Handle title update
            if (selector === 'title' && handler.element) {
              const mockElement = {
                setInnerContent: (content: string) => {
                  html = html.replace(/<title>.*?<\/title>/, `<title>${content}</title>`)
                },
                getAttribute: () => null,
                setAttribute: () => {},
                before: () => {},
                after: () => {},
                replace: () => {},
                remove: () => {},
                prepend: () => {},
                append: () => {},
                removeAndKeepContent: () => {},
              }
              handler.element(mockElement)
            }
          }

          controller.enqueue(new TextEncoder().encode(html))
          controller.close()
        },
      }),
      {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      }
    )
  }
}

vi.stubGlobal('HTMLRewriter', MockHTMLRewriter)

describe('Worker Rewriter Tests', () => {
  let worker: WorkerModule
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(async () => {
    // Import the worker module dynamically after mocks are set up
    const workerModule = await import('./worker')
    worker = workerModule.default as WorkerModule
  })

  beforeEach(() => {
    // Reset fetch mock before each test
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // Mock font loading for OG image generation
    const mockFontBuffer = new ArrayBuffer(1000)
    fetchMock.mockImplementation((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString()

      // Check if this is a font request
      if (urlString.includes('fontsource')) {
        return Promise.resolve(
          new Response(mockFontBuffer, {
            status: 200,
            headers: { 'content-type': 'font/woff' },
          })
        )
      }

      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  it('should return HTML with correct OG meta tags and NO duplicates and PRESERVE existing og:image', async () => {
    // Mock the index.html response with conflicting default tags and an existing OG image
    const mockHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Default</title>
  <meta property="og:title" content="Old Title" />
  <meta property="og:description" content="Old Desc" />
  <meta property="og:image" content="https://example.com/existing-image.png" />
  <meta name="description" content="Old Desc" />
</head>
<body></body>
</html>`

    fetchMock.mockResolvedValueOnce(
      new Response(mockHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    )

    const request = new Request('http://localhost:8787/My-Title/My-Snippet')
    const response = await worker.fetch(request, {}, {} as ExecutionContext)
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')

    // Check for new tags
    expect(text).toContain('<meta property="og:title" content="My Title" />')
    expect(text).toContain('<meta property="og:description" content="My Snippet" />')

    // Check for PRESERVED OG Image
    // It should NOT be replaced by the worker, so it should be the one from mockHtml
    expect(text).toContain('<meta property="og:image" content="https://example.com/existing-image.png" />')

    // Check for absence of old tags (title, description)
    expect(text).not.toContain('<meta property="og:title" content="Old Title" />')
    expect(text).not.toContain('<meta property="og:description" content="Old Desc" />')
    expect(text).not.toContain('<meta name="description" content="Old Desc" />')
  })
})
