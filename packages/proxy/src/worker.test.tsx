
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

interface WorkerModule {
  fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>
}

const MOCK_ENV = {
  OG_SECRET: 'test-secret',
}

// Mock handlers to verify routing logic
vi.mock('./handlers', () => ({
  handleApiOg: vi.fn(async () => new Response('API OG', { status: 200 })),
  handleHome: vi.fn(async () => new Response('Home', { status: 200 })),
  handleMetadataRoute: vi.fn(async () => new Response('Metadata', { status: 200 })),
}))

import { handleApiOg, handleHome, handleMetadataRoute } from './handlers'


describe('Worker Routing', () => {
  let worker: WorkerModule
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(async () => {
    const workerModule = await import('./worker')
    worker = workerModule.default as WorkerModule
  })

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.clearAllMocks()
  })

  it('should route /api/og to handleApiOg', async () => {
    const request = new Request('http://localhost:8787/api/og')
    const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
    
    expect(handleApiOg).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('API OG')
  })

  it('should route / to handleHome', async () => {
    const request = new Request('http://localhost:8787/')
    const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

    expect(handleHome).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Home')
  })

  it('should route /Title/Snippet to handleMetadataRoute', async () => {
    const request = new Request('http://localhost:8787/My-Title/My-Snippet')
    const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)

    expect(handleMetadataRoute).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Metadata')
  })

  it('should passthrough static assets', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Static Asset', { status: 200 }))
      const request = new Request('http://localhost:8787/style.css')
      const response = await worker.fetch(request, MOCK_ENV, {} as ExecutionContext)
      
      expect(fetchMock).toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Static Asset')
      
      expect(handleApiOg).not.toHaveBeenCalled()
      expect(handleHome).not.toHaveBeenCalled()
      expect(handleMetadataRoute).not.toHaveBeenCalled()
  })
})
