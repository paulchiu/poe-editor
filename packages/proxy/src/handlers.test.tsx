import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleMetadataRoute } from './handlers'

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
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('handleMetadataRoute', () => {
    it('should proxy index request', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Index HTML', { status: 200 }))
      const request = new Request('http://localhost/Title/Snippet')
      await handleMetadataRoute(request, { title: 'Title', snippet: 'Snippet' }, {})
      expect(fetchMock).toHaveBeenCalledWith('http://localhost/index.html')
    })
  })
})
