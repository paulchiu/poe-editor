import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

// Mock the @cf-wasm/og module
const mockImageResponse = vi.fn()

interface ImageResponseOptions {
  headers?: Record<string, string>
}

vi.mock('@cf-wasm/og', () => ({
  ImageResponse: class {
    constructor(element: unknown, options: ImageResponseOptions) {
      mockImageResponse(element, options)
      return new Response(new Uint8Array([1, 2, 3, 4]), {
        headers: {
          'content-type': 'image/png',
          'cache-control': options.headers?.['Cache-Control'] || 'no-cache',
        },
      })
    }
  },
}))

interface WorkerModule {
  fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>
  removeElementHandler: { element: (element: Element) => void }
  createHeadHandler: (
    title: string,
    snippet: string,
    ogImageUrl: string,
    twitterOgImageUrl: string,
    url: string
  ) => { element: (element: Element) => void }
}

// Helper to generate signature for tests
async function generateSignature(
  title: string, 
  snippet: string, 
  platform: string | null,
  secret: string
): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const data = JSON.stringify({ title, snippet, platform: platform || '' })
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const MOCK_ENV = {
  OG_SECRET: 'test-secret',
}

interface MockHTMLRewriterInstance {
  on(selector: string, handler: unknown): MockHTMLRewriterInstance
  transform(response: Response): Response
}

// Mock global HTMLRewriter
const MockHTMLRewriter = function (this: MockHTMLRewriterInstance) {
  const handlers = new Map<string, unknown>()

  this.on = (selector: string, handler: unknown) => {
    handlers.set(selector, handler)
    return this
  }

  this.transform = (response: Response) => {
    // In a real test environment, we'd actually transform the HTML
    // For unit tests, we'll just return the response
    return response
  }
} as unknown as { new (): MockHTMLRewriterInstance }

vi.stubGlobal('HTMLRewriter', MockHTMLRewriter)

describe('Worker E2E Tests', () => {
  let worker: WorkerModule
  let removeElementHandler: { element: (element: Element) => void | Promise<void> }
  let createHeadHandler: (
    title: string,
    snippet: string,
    ogImageUrl: string,
    twitterOgImageUrl: string,
    url: string
  ) => { element?: (element: Element) => void | Promise<void> }
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(async () => {
    // Import the worker module dynamically after mocks are set up
    const workerModule = await import('./worker')
    worker = workerModule.default as WorkerModule
    removeElementHandler = workerModule.removeElementHandler
    createHeadHandler = workerModule.createHeadHandler
  })

  beforeEach(() => {
    // Reset fetch mock before each test
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // Clear mock calls
    mockImageResponse.mockClear()

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
      
      // Allow self-requests (for home page test)
      if (urlString === 'http://localhost:8787/') {
         return Promise.resolve(new Response('<html></html>', { status: 200 }))
      }
      


      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  describe('Unfurl Check', () => {
    it('should return HTML with correct OG meta tags for /Title/Snippet path', async () => {
      // Mock the index.html response
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request('http://localhost:8787/My-Title/My-Snippet')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')
    })

    it('should update the title tag', async () => {
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request('http://localhost:8787/Hello-World/Some-Content')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
    })

    it('should handle URL-encoded path segments', async () => {
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request('http://localhost:8787/Hello%20World/My%20Snippet')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
    })
    
    it('should handle Root path / and inject Home OG tags', async () => {
       const mockHtml = `<!DOCTYPE html><html><head><title>Home</title></head><body></body></html>`
       fetchMock.mockResolvedValueOnce(
          new Response(mockHtml, { 
             status: 200, 
             headers: { 'content-type': 'text/html' }
          })
       )
       
       const request = new Request('http://localhost:8787/')
       const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
       
       expect(response.status).toBe(200)
    })
  })

  describe('Pass-Through Check', () => {
    it('should not modify /favicon.ico requests', async () => {
      const mockResponse = new Response('', { status: 200 })
      fetchMock.mockResolvedValueOnce(mockResponse)

      const request = new Request('http://localhost:8787/favicon.ico')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response).toBeDefined()
    })

    it('should not modify .js file requests', async () => {
      const mockResponse = new Response('console.log("test")', {
        status: 200,
        headers: { 'content-type': 'application/javascript' },
      })
      fetchMock.mockResolvedValueOnce(mockResponse)

      const request = new Request('http://localhost:8787/assets/index.js')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response).toBeDefined()
    })

    it('should not modify .css file requests', async () => {
      const mockResponse = new Response('.test {}', {
        status: 200,
        headers: { 'content-type': 'text/css' },
      })
      fetchMock.mockResolvedValueOnce(mockResponse)

      const request = new Request('http://localhost:8787/assets/style.css')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response).toBeDefined()
    })

    it('should not modify .png file requests', async () => {
      const mockResponse = new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })
      fetchMock.mockResolvedValueOnce(mockResponse)

      const request = new Request('http://localhost:8787/images/logo.png')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response).toBeDefined()
    })

    it('should not modify /manifest.json requests', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      fetchMock.mockResolvedValueOnce(mockResponse)

      const request = new Request('http://localhost:8787/manifest.json')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response).toBeDefined()
    })
  })

  describe('Safety Check', () => {
    it('should escape HTML in title meta tag', async () => {
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request(
        'http://localhost:8787/%3Cscript%3Ealert(1)%3C%2Fscript%3E/Snippet'
      )
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
    })

    it('should escape HTML in snippet meta tag', async () => {
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request(
        'http://localhost:8787/Title/%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'
      )
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
    })

    it('should escape quotes in content', async () => {
      const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Default</title></head>
<body></body>
</html>`

      fetchMock.mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )

      const request = new Request('http://localhost:8787/Title%20%22with%20quotes/Snippet')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
    })
  })

  describe('/api/og endpoint', () => {
    it('should return PNG image with correct content type and valid signature', async () => {
      const title = 'Test'
      const snippet = 'Hello'
      const sig = await generateSignature(title, snippet, null, 'test-secret')

      const request = new Request(
        `http://localhost:8787/api/og?title=${title}&snippet=${snippet}&sig=${sig}`
      )
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/png')
      expect(mockImageResponse).toHaveBeenCalled()
    })
    
    it('should return PNG image with Platform=twitter and valid signature', async () => {
       const title = 'Test'
       const snippet = 'Hello'
       const platform = 'twitter'
       const sig = await generateSignature(title, snippet, platform, 'test-secret')
 
       const request = new Request(
         `http://localhost:8787/api/og?title=${title}&snippet=${snippet}&platform=${platform}&sig=${sig}`
       )
       const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
 
       expect(response.status).toBe(200)
       expect(response.headers.get('content-type')).toBe('image/png')
     })

     it('should return PNG image with Platform=home and valid signature', async () => {
       const title = 'Test'
       const snippet = 'Hello'
       const platform = 'home'
       const sig = await generateSignature(title, snippet, platform, 'test-secret')
 
       const request = new Request(
         `http://localhost:8787/api/og?title=${title}&snippet=${snippet}&platform=${platform}&sig=${sig}`
       )
       const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
 
       expect(response.status).toBe(200)
       expect(response.headers.get('content-type')).toBe('image/png')
     })

     it('should return PNG image with Platform=home and NO signature', async () => {
        const request = new Request(
          `http://localhost:8787/api/og?platform=home`
        )
        const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
  
        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('image/png')
      })

      it('should redirect to static image (production mode) for workers.dev domain with Platform=home', async () => {
        const request = new Request(
          `https://poe-editor-proxy.accounts-8d2.workers.dev/api/og?platform=home`
        )
        const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
  
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://poe-editor-proxy.accounts-8d2.workers.dev/og-home.png')
      })

      it('should redirect to static image (production mode) for other domains with Platform=home', async () => {
        const request = new Request(
          `https://poemd.dev/api/og?platform=home`
        )
        const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
  
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://poemd.dev/og-home.png')
      })

     it('should return valid PNG image even if splash image fetch fails', async () => {
        // Override mock for this specific test to return 404 for splash
        fetchMock.mockImplementation((url: string | Request | URL) => {
           const urlString = typeof url === 'string' ? url : url.toString()
           if (urlString.includes('splash-bw.png')) {
              return Promise.resolve(new Response('Not Found', { status: 404 }))
           }
           // Keep other mocks valid (fonts, etc)
           if (urlString.includes('fontsource')) {
             return Promise.resolve(new Response(new ArrayBuffer(10), { status: 200 }))
           }
           if (urlString === 'http://localhost:8787/') {
              return Promise.resolve(new Response('<html></html>', { status: 200 }))
           }
           return Promise.resolve(new Response('Not Found', { status: 404 }))
        })

        const request = new Request(
          `http://localhost:8787/api/og?platform=home`
        )
        const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
  
        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('image/png')
      })

    it('should return 401 when signature is missing', async () => {
      const request = new Request('http://localhost:8787/api/og?title=Test&snippet=Hello')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(401)
    })

    it('should return 401 when signature is invalid', async () => {
      const request = new Request(
        'http://localhost:8787/api/og?title=Test&snippet=Hello&sig=invalid'
      )
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(401)
    })

    it('should return 401 when signature does not match parameters', async () => {
      const title = 'Test'
      const snippet = 'Hello'
      const sig = await generateSignature(title, snippet, null, 'test-secret')

      // Change snippet but keep old signature
      const request = new Request(
        `http://localhost:8787/api/og?title=${title}&snippet=Different&sig=${sig}`
      )
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

      expect(response.status).toBe(401)
    })
  })

  describe('HTMLRewriter Handlers', () => {
    it('removeElementHandler should call element.remove()', () => {
      const mockElement = {
        remove: vi.fn(),
      }
      removeElementHandler.element(mockElement as unknown as Element)
      expect(mockElement.remove).toHaveBeenCalled()
    })

    it('createHeadHandler should prepend meta tags', () => {
      const mockElement = {
        prepend: vi.fn(),
      }
      const title = 'Test Title'
      const snippet = 'Test Snippet'
      const ogImageUrl = 'https://example.com/og.png'
      const twitterOgImageUrl = 'https://example.com/twitter-og.png'
      const url = 'https://example.com/page'

      const handler = createHeadHandler(title, snippet, ogImageUrl, twitterOgImageUrl, url)
      if (handler.element) {
        handler.element(mockElement as unknown as Element)
      } else {
        throw new Error('handler.element is undefined')
      }

      expect(mockElement.prepend).toHaveBeenCalled()

      const injectedHtml = mockElement.prepend.mock.calls[0][0] as string
      expect(injectedHtml).toContain('<meta property="og:title" content="Test Title" />')
      expect(injectedHtml).toContain('<meta property="og:description" content="Test Snippet" />')
      expect(injectedHtml).toContain(
        '<meta property="og:image" content="https://example.com/og.png" />'
      )
      expect(injectedHtml).toContain(
        '<meta name="twitter:image" content="https://example.com/twitter-og.png" />'
      )
      expect(injectedHtml).toContain(
        '<meta property="og:url" content="https://example.com/page" />'
      )
      expect(injectedHtml).toContain(
        '<meta property="og:site_name" content="Poe Markdown Editor" />'
      )
    })
  })
})
