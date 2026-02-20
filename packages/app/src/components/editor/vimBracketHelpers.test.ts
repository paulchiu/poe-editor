import type { editor } from 'monaco-editor'
import { describe, it, expect, vi } from 'vitest'
import type { CodeMirrorAdapter } from './vimTypes'
import {
  findMarkdownFenceTarget,
  findQuoteTarget,
  findStandardBracketTarget,
} from './vimBracketHelpers'

interface MockTextModel {
  getLineContent: (lineNumber: number) => string
  getLineCount: () => number
}

const createMockModel = (lines: string[]): MockTextModel => ({
  getLineContent: (lineNumber) => lines[lineNumber - 1] ?? '',
  getLineCount: () => lines.length,
})

describe('vimBracketHelpers', () => {
  it('finds the matching markdown fence forward and backward', () => {
    const model = createMockModel(['```ts', 'const value = 1', '```'])
    const monacoModel = model as unknown as editor.ITextModel

    expect(findMarkdownFenceTarget(monacoModel, { lineNumber: 1 }, '```ts')).toEqual({
      line: 2,
      ch: 0,
    })

    expect(findMarkdownFenceTarget(monacoModel, { lineNumber: 3 }, '```')).toEqual({
      line: 0,
      ch: 0,
    })
  })

  it('returns null for non-fence lines', () => {
    const model = createMockModel(['hello'])
    const monacoModel = model as unknown as editor.ITextModel

    expect(findMarkdownFenceTarget(monacoModel, { lineNumber: 1 }, 'hello')).toBeNull()
  })

  it('matches simple quotes and ignores escaped quotes', () => {
    expect(findQuoteTarget('say "hi" now', { line: 0, ch: 4 })).toEqual({ line: 0, ch: 7 })
    expect(findQuoteTarget('say "hi" now', { line: 0, ch: 7 })).toEqual({ line: 0, ch: 4 })
    expect(findQuoteTarget(String.raw`say \"hi\" now`, { line: 0, ch: 5 })).toBeNull()
  })

  it('matches smart quotes', () => {
    expect(findQuoteTarget('“hello”', { line: 0, ch: 0 })).toEqual({ line: 0, ch: 6 })
    expect(findQuoteTarget('“hello”', { line: 0, ch: 6 })).toEqual({ line: 0, ch: 0 })
  })

  it('returns null when cursor is not on a quote', () => {
    expect(findQuoteTarget('plain text', { line: 0, ch: 1 })).toBeNull()
  })

  it('uses monaco jump-to-bracket when available', () => {
    const setPosition = vi.fn()
    const trigger = vi.fn()
    const getPosition = vi.fn().mockReturnValue({ lineNumber: 3, column: 6 })

    const cm = {
      editor: {
        setPosition,
        trigger,
        getPosition,
      },
    } as unknown as CodeMirrorAdapter

    const target = findStandardBracketTarget(cm, { lineNumber: 2, column: 4 }, { line: 0, ch: 0 })

    expect(setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 4 })
    expect(trigger).toHaveBeenCalledWith('vim', 'editor.action.jumpToBracket', {})
    expect(target).toEqual({ line: 2, ch: 5 })
  })

  it('falls back to current position when monaco returns no bracket target', () => {
    const cm = {
      editor: {
        setPosition: vi.fn(),
        trigger: vi.fn(),
        getPosition: vi.fn().mockReturnValue(null),
      },
    } as unknown as CodeMirrorAdapter

    const target = findStandardBracketTarget(cm, { lineNumber: 2, column: 4 }, { line: 4, ch: 2 })

    expect(target).toEqual({ line: 4, ch: 2 })
  })
})
