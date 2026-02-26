import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

interface WorkerModule {
  fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>
}

// Mock handlers to verify routing logic
vi.mock('./handlers', () => ({
  handleMetadataRoute: vi.fn(async () => new Response('Metadata', { status: 200 })),
}))

import { handleMetadataRoute } from './handlers'

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

  it('should route / path to fetch (passthrough)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Index', { status: 200 }))
    const request = new Request('http://localhost:8787/')
    const response = await worker.fetch(request, {}, {} as ExecutionContext)

    expect(fetchMock).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Index')
  })

  it('should route /Title/Snippet to handleMetadataRoute', async () => {
    const request = new Request('http://localhost:8787/My-Title/My-Snippet')
    const response = await worker.fetch(request, {}, {} as ExecutionContext)

    expect(handleMetadataRoute).toHaveBeenCalledWith(
      request,
      {
        title: 'My Title',
        snippet: 'My Snippet',
        heroImageUrl: undefined,
      },
      {}
    )
    expect(handleMetadataRoute).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Metadata')
  })

  it('should pass hero query param to metadata handler', async () => {
    const request = new Request(
      'http://localhost:8787/My-Title/My-Snippet?hero=https%3A%2F%2Fcdn.example.com%2Fhero.png'
    )

    await worker.fetch(request, {}, {} as ExecutionContext)

    expect(handleMetadataRoute).toHaveBeenCalledWith(
      request,
      {
        title: 'My Title',
        snippet: 'My Snippet',
        heroImageUrl: 'https://cdn.example.com/hero.png',
      },
      {}
    )
  })

  it('should ignore non-http hero query params', async () => {
    const request = new Request(
      'http://localhost:8787/My-Title/My-Snippet?hero=javascript%3Aalert%281%29'
    )

    await worker.fetch(request, {}, {} as ExecutionContext)

    expect(handleMetadataRoute).toHaveBeenCalledWith(
      request,
      {
        title: 'My Title',
        snippet: 'My Snippet',
        heroImageUrl: undefined,
      },
      {}
    )
  })
})
