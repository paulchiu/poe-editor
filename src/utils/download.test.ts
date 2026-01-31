import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadFile } from './download'

describe('downloadFile', () => {
  const createObjectURLMock = vi.fn()
  const revokeObjectURLMock = vi.fn()

  // Mock URL object
  global.URL.createObjectURL = createObjectURLMock
  global.URL.revokeObjectURL = revokeObjectURLMock

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create a link and trigger download', () => {
    // Mock document methods
    const clickMock = vi.fn()
    const linkMock = {
      href: '',
      download: '',
      click: clickMock,
      style: {}, // Minimal mock for style if needed
    } as unknown as HTMLAnchorElement

    const createElementMock = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildMock = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => linkMock)
    const removeChildMock = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => linkMock)

    createObjectURLMock.mockReturnValue('blob:http://localhost/mock-url')

    const filename = 'test.txt'
    const content = 'Hello, world!'
    downloadFile(filename, content)

    // Verify blob creation (indirectly via createObjectURL call)
    expect(createObjectURLMock).toHaveBeenCalled()
    const blobArg = createObjectURLMock.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)

    // Verify link attributes
    expect(linkMock.download).toBe(filename)
    expect(linkMock.href).toBe('blob:http://localhost/mock-url')

    // Verify DOM interaction
    expect(createElementMock).toHaveBeenCalledWith('a')
    expect(appendChildMock).toHaveBeenCalledWith(linkMock)
    expect(clickMock).toHaveBeenCalled()
    expect(removeChildMock).toHaveBeenCalledWith(linkMock)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/mock-url')
  })

  it('should use correct mime type', () => {
    // Mock document methods
    const clickMock = vi.fn()
    const linkMock = {
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    downloadFile('test.json', '{}', 'application/json')

    expect(createObjectURLMock).toHaveBeenCalled()
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob
    expect(blobArg.type).toBe('application/json')
  })
})
