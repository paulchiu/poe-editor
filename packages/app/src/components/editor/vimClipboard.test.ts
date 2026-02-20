import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from '@/hooks/useToast'
import type { CodeMirrorAdapter, VimAPI, VimOperatorArgs } from './vimTypes'
import { createPasteSystemAction, createYankSystemOperator } from './vimClipboard'

vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}))

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn>
  readText: ReturnType<typeof vi.fn>
}

const setClipboard = (clipboard: ClipboardMock): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    writable: true,
    configurable: true,
  })
}

const createVim = () => {
  const pushText = vi.fn()
  const handleKey = vi.fn()
  const vim = {
    getRegisterController: () => ({ pushText }),
    handleKey,
  } as unknown as VimAPI

  return { vim, pushText, handleKey }
}

const createAdapter = (selection: string): CodeMirrorAdapter =>
  ({
    getSelection: () => selection,
    state: { vim: { visualBlock: false } },
    editor: {} as CodeMirrorAdapter['editor'],
  }) as CodeMirrorAdapter

describe('vimClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('yanks selected text to system clipboard and vim registers', async () => {
    const clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn(),
    }
    setClipboard(clipboard)

    const { vim, pushText } = createVim()
    const yank = createYankSystemOperator(vim)
    const oldAnchor = { line: 1, ch: 1 }

    const result = yank(
      createAdapter('selected text'),
      { registerName: 'a', linewise: false },
      null,
      oldAnchor
    )

    await Promise.resolve()

    expect(result).toBe(oldAnchor)
    expect(clipboard.writeText).toHaveBeenCalledWith('selected text')
    expect(pushText).toHaveBeenCalledWith('a', 'yank', 'selected text', false, false)
  })

  it('shows an error toast when writing to clipboard fails', async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
      readText: vi.fn(),
    }
    setClipboard(clipboard)

    const { vim } = createVim()
    const yank = createYankSystemOperator(vim)

    yank(createAdapter('selected text'), { registerName: '"', linewise: false }, null, null)
    await Promise.resolve()

    expect(toast).toHaveBeenCalledWith({
      description: 'Failed to write to system clipboard',
      variant: 'destructive',
    })
  })

  it('does not touch clipboard when there is no selection', () => {
    const clipboard = {
      writeText: vi.fn(),
      readText: vi.fn(),
    }
    setClipboard(clipboard)

    const { vim, pushText } = createVim()
    const yank = createYankSystemOperator(vim)

    yank(createAdapter(''), { registerName: '"', linewise: false }, null, null)

    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(pushText).not.toHaveBeenCalled()
  })

  it('pastes clipboard text after or before the cursor', async () => {
    const clipboard = {
      writeText: vi.fn(),
      readText: vi.fn().mockResolvedValue('line one\nline two\n'),
    }
    setClipboard(clipboard)

    const { vim, pushText, handleKey } = createVim()
    const paste = createPasteSystemAction(vim)
    const adapter = createAdapter('')
    const argsAfter: VimOperatorArgs = { registerName: '"', linewise: false, after: true }
    const argsBefore: VimOperatorArgs = { registerName: '"', linewise: false, after: false }

    await paste(adapter, argsAfter)
    await paste(adapter, argsBefore)

    expect(pushText).toHaveBeenCalledWith('"', 'yank', 'line one\nline two\n', true, false)
    expect(handleKey).toHaveBeenCalledWith(adapter, '<PasteTrigger>')
    expect(handleKey).toHaveBeenCalledWith(adapter, '<PasteTriggerBefore>')
  })

  it('skips paste commands when clipboard text is empty', async () => {
    const clipboard = {
      writeText: vi.fn(),
      readText: vi.fn().mockResolvedValue(''),
    }
    setClipboard(clipboard)

    const { vim, pushText, handleKey } = createVim()
    const paste = createPasteSystemAction(vim)

    await paste(createAdapter(''), { registerName: '"', linewise: false, after: true })

    expect(pushText).not.toHaveBeenCalled()
    expect(handleKey).not.toHaveBeenCalled()
  })

  it('shows an error toast when reading from clipboard fails', async () => {
    const clipboard = {
      writeText: vi.fn(),
      readText: vi.fn().mockRejectedValue(new Error('denied')),
    }
    setClipboard(clipboard)

    const { vim } = createVim()
    const paste = createPasteSystemAction(vim)

    await paste(createAdapter(''), { registerName: '"', linewise: false })

    expect(toast).toHaveBeenCalledWith({
      description: 'Failed to read from system clipboard',
      variant: 'destructive',
    })
  })
})
