import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleApiOg, handleHome, handleMetadataRoute } from './handlers'
import { Env } from './utils'
import { generateSignature } from './crypto'

// Mock ImageResponse
vi.mock('@cf-wasm/og', () => ({
  ImageResponse: {
    async: async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'content-type': 'image/png' },
      }),
  },
  GoogleFont: class {
    constructor() {}
  },
}))

// Mock HTMLRewriter
const mockHTMLRewriter = {
  on: vi.fn(),
  transform: vi.fn(),
}
mockHTMLRewriter.on.mockReturnValue(mockHTMLRewriter)
mockHTMLRewriter.transform.mockImplementation((res) => res)

vi.stubGlobal('HTMLRewriter', function () {
  return mockHTMLRewriter
})

describe('Handlers', () => {
  const mockEnv: Env = {
    OG_SECRET: 'test-secret',
    ENVIRONMENT: 'development',
    ASSETS: {
      fetch: vi.fn().mockImplementation(() => Promise.resolve(new Response(new ArrayBuffer(10)))),
    } as any,
  }
  let fetchMock: any

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // Mock font fetching
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('fontsource')) {
        return Promise.resolve(new Response(new ArrayBuffer(10)))
      }
      return Promise.resolve(new Response('OK'))
    })
  })

  describe('handleApiOg', () => {
    it('should return 401 if signature is missing', async () => {
      const request = new Request('http://localhost/api/og?title=Test&snippet=Test')
      const response = await handleApiOg(request, mockEnv)
      expect(response.status).toBe(401)
    })

    it('should return 401 if signature is invalid', async () => {
      const request = new Request('http://localhost/api/og?title=Test&snippet=Test&sig=invalid')
      const response = await handleApiOg(request, mockEnv)
      expect(response.status).toBe(401)
    })

    it('should return image if signature is valid', async () => {
      const sig = await generateSignature('Test', 'Test', null, 'test-secret')
      const request = new Request(`http://localhost/api/og?title=Test&snippet=Test&sig=${sig}`)
      const response = await handleApiOg(request, mockEnv)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/png')
    })

    it('should allow home platform without signature', async () => {
      const request = new Request('http://localhost/api/og?platform=home')
      const response = await handleApiOg(request, mockEnv)
      expect(response.status).toBe(200)
    })
  })

  describe('handleHome', () => {
    it('should proxy index request', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Index HTML', { status: 200 }))
      const request = new Request('http://localhost/')
      await handleHome(request, mockEnv)
      expect(fetchMock).toHaveBeenCalledWith('http://localhost/')
    })
  })

  describe('handleMetadataRoute', () => {
    it('should proxy index request', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Index HTML', { status: 200 }))
      const request = new Request('http://localhost/Title/Snippet')
      await handleMetadataRoute(request, mockEnv, { title: 'Title', snippet: 'Snippet' })
      expect(fetchMock).toHaveBeenCalledWith('http://localhost/index.html')
    })
  })
})
