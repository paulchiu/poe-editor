import type { editor } from 'monaco-editor'
import { describe, it, expect, vi } from 'vitest'
import type { CodeMirrorAdapter } from './vimTypes'
import {
  moveByDisplayLinesMotion,
  moveToEndOfDisplayLineMotion,
  moveToMatchingBracketMotion,
  moveToStartOfDisplayLineMotion,
} from './vimMotions'

interface Position {
  lineNumber: number
  column: number
}

interface MockTextModel {
  getLineContent: (lineNumber: number) => string
  getLineCount: () => number
}

const createModel = (lines: string[]): editor.ITextModel =>
  ({
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
    getLineCount: () => lines.length,
  }) as unknown as editor.ITextModel

const createCodeMirrorAdapter = ({
  position,
  model,
}: {
  position: Position
  model?: MockTextModel | null
}): CodeMirrorAdapter => {
  let currentPosition = position
  const currentModel = model ?? null

  const editorMock = {
    setPosition: vi.fn((next: Position) => {
      currentPosition = next
    }),
    trigger: vi.fn((_source: string, command: string) => {
      if (command === 'cursorDown') {
        currentPosition = { ...currentPosition, lineNumber: currentPosition.lineNumber + 1 }
      }
      if (command === 'cursorUp') {
        currentPosition = {
          ...currentPosition,
          lineNumber: Math.max(1, currentPosition.lineNumber - 1),
        }
      }
      if (command === 'cursorHome') {
        currentPosition = { ...currentPosition, column: 1 }
      }
      if (command === 'cursorEnd') {
        currentPosition = { ...currentPosition, column: 12 }
      }
      if (command === 'cursorLeft') {
        currentPosition = { ...currentPosition, column: Math.max(1, currentPosition.column - 1) }
      }
      if (command === 'editor.action.jumpToBracket') {
        currentPosition = { lineNumber: currentPosition.lineNumber, column: 9 }
      }
    }),
    getPosition: vi.fn(() => currentPosition),
    getModel: vi.fn(() => currentModel),
  }

  return {
    getSelection: () => '',
    state: { vim: { visualBlock: false } },
    editor: editorMock as unknown as editor.IStandaloneCodeEditor,
  }
}

describe('vimMotions', () => {
  it('moves by display lines in both directions', () => {
    const cmForward = createCodeMirrorAdapter({ position: { lineNumber: 3, column: 5 } })
    const forwardTarget = moveByDisplayLinesMotion(
      cmForward,
      { line: 2, ch: 4 },
      { repeat: 2, forward: true }
    )
    expect(forwardTarget).toEqual({ line: 4, ch: 4 })

    const cmBackward = createCodeMirrorAdapter({ position: { lineNumber: 3, column: 5 } })
    const backwardTarget = moveByDisplayLinesMotion(
      cmBackward,
      { line: 2, ch: 4 },
      { repeat: 1, forward: false }
    )
    expect(backwardTarget).toEqual({ line: 1, ch: 4 })
  })

  it('falls back when moveByDisplayLinesMotion cannot read a cursor position', () => {
    const cm = createCodeMirrorAdapter({ position: { lineNumber: 2, column: 2 } })
    vi.mocked(cm.editor.getPosition).mockReturnValue(null)

    const target = moveByDisplayLinesMotion(cm, { line: 1, ch: 1 }, { forward: true })
    expect(target).toEqual({ line: 1, ch: 1 })
  })

  it('prefers markdown fences and quotes before bracket fallback', () => {
    const fenceModel = createModel(['```ts', 'const value = 1', '```'])
    const fenceAdapter = createCodeMirrorAdapter({
      position: { lineNumber: 1, column: 1 },
      model: fenceModel,
    })
    expect(moveToMatchingBracketMotion(fenceAdapter, { line: 0, ch: 0 })).toEqual({
      line: 2,
      ch: 0,
    })

    const quoteModel = createModel(['say "hello"'])
    const quoteAdapter = createCodeMirrorAdapter({
      position: { lineNumber: 1, column: 5 },
      model: quoteModel,
    })
    expect(moveToMatchingBracketMotion(quoteAdapter, { line: 0, ch: 4 })).toEqual({
      line: 0,
      ch: 10,
    })

    const bracketModel = createModel(['(abc)'])
    const bracketAdapter = createCodeMirrorAdapter({
      position: { lineNumber: 1, column: 2 },
      model: bracketModel,
    })
    expect(moveToMatchingBracketMotion(bracketAdapter, { line: 0, ch: 1 })).toEqual({
      line: 0,
      ch: 8,
    })
  })

  it('falls back to current head when no model exists', () => {
    const cm = createCodeMirrorAdapter({ position: { lineNumber: 1, column: 1 }, model: null })
    expect(moveToMatchingBracketMotion(cm, { line: 4, ch: 9 })).toEqual({ line: 4, ch: 9 })
  })

  it('moves to the start and end of display lines', () => {
    const startAdapter = createCodeMirrorAdapter({ position: { lineNumber: 2, column: 7 } })
    expect(moveToStartOfDisplayLineMotion(startAdapter, { line: 1, ch: 6 })).toEqual({
      line: 1,
      ch: 0,
    })

    const endAdapter = createCodeMirrorAdapter({ position: { lineNumber: 2, column: 2 } })
    const endTarget = moveToEndOfDisplayLineMotion(endAdapter, { line: 1, ch: 1 })
    expect(endTarget).toEqual({ line: 1, ch: 10 })
    expect(endAdapter.editor.trigger).toHaveBeenCalledWith('vim', 'cursorLeft', {})
  })

  it('falls back when start/end motions cannot read a cursor position', () => {
    const startAdapter = createCodeMirrorAdapter({ position: { lineNumber: 2, column: 2 } })
    vi.mocked(startAdapter.editor.getPosition).mockReturnValue(null)

    expect(moveToStartOfDisplayLineMotion(startAdapter, { line: 3, ch: 3 })).toEqual({
      line: 3,
      ch: 3,
    })

    const endAdapter = createCodeMirrorAdapter({ position: { lineNumber: 2, column: 2 } })
    vi.mocked(endAdapter.editor.getPosition).mockReturnValue(null)

    expect(moveToEndOfDisplayLineMotion(endAdapter, { line: 5, ch: 1 })).toEqual({ line: 5, ch: 1 })
  })
})
