import { describe, it, expect, vi, beforeEach } from 'vitest'

interface VimMocks {
  defineOperator: ReturnType<typeof vi.fn>
  defineAction: ReturnType<typeof vi.fn>
  mapCommand: ReturnType<typeof vi.fn>
  defineMotion: ReturnType<typeof vi.fn>
  defineOption: ReturnType<typeof vi.fn>
}

const setupModule = async (): Promise<{
  setupVim: () => void
  vimMocks: VimMocks
}> => {
  vi.resetModules()

  const vimMocks: VimMocks = {
    defineOperator: vi.fn(),
    defineAction: vi.fn(),
    mapCommand: vi.fn(),
    defineMotion: vi.fn(),
    defineOption: vi.fn(),
  }

  vi.doMock('monaco-vim', () => ({
    VimMode: {
      Vim: vimMocks,
    },
  }))

  const module = await import('./vim')
  return { setupVim: module.setupVim, vimMocks }
}

describe('setupVim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps zz to center the cursor line in the editor viewport', async () => {
    const { setupVim, vimMocks } = await setupModule()

    setupVim()

    expect(vimMocks.mapCommand).toHaveBeenCalledWith('zz', 'action', 'centerCursorLine')

    const centerActionCall = vimMocks.defineAction.mock.calls.find(
      ([name]) => name === 'centerCursorLine'
    )
    expect(centerActionCall).toBeDefined()

    const centerCursorLineAction = centerActionCall?.[1]
    const revealLineInCenter = vi.fn()
    const cm = {
      editor: {
        getPosition: vi.fn(() => ({ lineNumber: 14 })),
        revealLineInCenter,
      },
    }

    centerCursorLineAction?.(cm)

    expect(revealLineInCenter).toHaveBeenCalledWith(14)
  })
})
