import { describe, it, expect, vi, beforeEach } from 'vitest'

interface VimMocks {
  defineOperator: ReturnType<typeof vi.fn>
  defineAction: ReturnType<typeof vi.fn>
  mapCommand: ReturnType<typeof vi.fn>
  defineMotion: ReturnType<typeof vi.fn>
  defineOption: ReturnType<typeof vi.fn>
  defineEx: ReturnType<typeof vi.fn>
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
    defineEx: vi.fn(),
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

  it('registers displayline option and configurable line-boundary mappings', async () => {
    const { setupVim, vimMocks } = await setupModule()
    setupVim()

    expect(vimMocks.mapCommand).toHaveBeenCalledWith('0', 'motion', 'moveToStartOfConfigurableLine')
    expect(vimMocks.mapCommand).toHaveBeenCalledWith(
      '^',
      'motion',
      'moveToFirstNonWhitespaceConfigurableLine'
    )
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('$', 'motion', 'moveToEndOfConfigurableLine', {
      inclusive: true,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('g$', 'motion', 'moveToEndOfDisplayLine', {
      inclusive: true,
    })

    const displayLineOptionCall = vimMocks.defineOption.mock.calls.find(
      ([name]) => name === 'displayline'
    )
    expect(displayLineOptionCall).toBeDefined()
  })

  it('maps line-relative, paragraph, and jump-history keys', async () => {
    const { setupVim, vimMocks } = await setupModule()
    setupVim()

    expect(vimMocks.mapCommand).toHaveBeenCalledWith('j', 'motion', 'moveByConfigurableLines', {
      forward: true,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('k', 'motion', 'moveByConfigurableLines', {
      forward: false,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('gj', 'motion', 'moveByDisplayLines', {
      forward: true,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('gk', 'motion', 'moveByDisplayLines', {
      forward: false,
    })

    expect(vimMocks.mapCommand).toHaveBeenCalledWith('+', 'motion', 'moveToRelativeLineStart', {
      direction: 1,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('-', 'motion', 'moveToRelativeLineStart', {
      direction: -1,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('_', 'motion', 'moveToRelativeLineStart', {
      anchorCurrent: true,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('{', 'motion', 'moveByMarkdownParagraph', {
      forward: false,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('}', 'motion', 'moveByMarkdownParagraph', {
      forward: true,
    })
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('<C-o>', 'action', 'jumpBackCursorHistory')
    expect(vimMocks.mapCommand).toHaveBeenCalledWith('<C-i>', 'action', 'jumpForwardCursorHistory')
  })
})
