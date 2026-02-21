import type { editor } from 'monaco-editor'
import { describe, it, expect, vi } from 'vitest'
import { getTableAtCursor, getTableSelection, handleTableNavigation } from './table'

interface RangeLike {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

const createModel = (lines: string[]): editor.ITextModel =>
  ({
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
    getLineCount: () => lines.length,
    getLineMaxColumn: (lineNumber: number) => (lines[lineNumber - 1]?.length ?? 0) + 1,
    getValueInRange: ({ startLineNumber, endLineNumber }: RangeLike) =>
      lines.slice(startLineNumber - 1, endLineNumber).join('\n'),
  }) as unknown as editor.ITextModel

const TABLE_LINES = ['Intro', '| Name | Role |', '| --- | --- |', '| Poe | Dev |', 'Outro']

const createEditor = ({
  model,
  position,
}: {
  model: editor.ITextModel | null
  position: { lineNumber: number; column: number } | null
}): editor.IStandaloneCodeEditor => {
  let currentPosition = position

  return {
    getPosition: vi.fn(() => currentPosition),
    getModel: vi.fn(() => model),
    setPosition: vi.fn((nextPosition: { lineNumber: number; column: number }) => {
      currentPosition = nextPosition
    }),
    revealPosition: vi.fn(),
  } as unknown as editor.IStandaloneCodeEditor
}

describe('table utilities', () => {
  it('finds table scope and cursor location', () => {
    const model = createModel(TABLE_LINES)
    const scope = getTableAtCursor(model, { lineNumber: 4, column: 11 })

    expect(scope).not.toBeNull()
    expect(scope?.startLine).toBe(2)
    expect(scope?.range.endLineNumber).toBe(4)
    expect(scope?.rowIndex).toBe(2)
    expect(scope?.colIndex).toBe(1)
    expect(scope?.rows).toHaveLength(3)
  })

  it('returns null when cursor is not inside a valid markdown table', () => {
    const model = createModel(['plain text', 'more plain text'])
    expect(getTableAtCursor(model, { lineNumber: 1, column: 1 })).toBeNull()

    const invalidModel = createModel(['| only | one | row |'])
    expect(getTableAtCursor(invalidModel, { lineNumber: 1, column: 5 })).toBeNull()
  })

  it('clamps column index when cursor is past the last table cell', () => {
    const model = createModel(TABLE_LINES)
    const scope = getTableAtCursor(model, { lineNumber: 4, column: 100 })

    expect(scope?.colIndex).toBe(1)
  })

  it('navigates table cells forward and backward', () => {
    const model = createModel(TABLE_LINES)
    const forwardEditor = createEditor({ model, position: { lineNumber: 2, column: 3 } })

    handleTableNavigation(forwardEditor, 1)
    expect(forwardEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 10 })
    expect(forwardEditor.revealPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 10 })

    const wrapForwardEditor = createEditor({ model, position: { lineNumber: 4, column: 10 } })
    handleTableNavigation(wrapForwardEditor, 1)
    expect(wrapForwardEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 3 })

    const wrapBackwardEditor = createEditor({ model, position: { lineNumber: 2, column: 3 } })
    handleTableNavigation(wrapBackwardEditor, -1)
    expect(wrapBackwardEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 4, column: 9 })
  })

  it('returns early from table navigation when prerequisites are missing', () => {
    const model = createModel(TABLE_LINES)

    const noPositionEditor = createEditor({ model, position: null })
    handleTableNavigation(noPositionEditor, 1)
    expect(noPositionEditor.setPosition).not.toHaveBeenCalled()

    const noModelEditor = createEditor({ model: null, position: { lineNumber: 2, column: 3 } })
    handleTableNavigation(noModelEditor, 1)
    expect(noModelEditor.setPosition).not.toHaveBeenCalled()

    const nonTableEditor = createEditor({
      model: createModel(['plain text']),
      position: { lineNumber: 1, column: 1 },
    })
    handleTableNavigation(nonTableEditor, 1)
    expect(nonTableEditor.setPosition).not.toHaveBeenCalled()
  })

  it('returns selected table rows and columns from an editor selection', () => {
    const model = createModel(TABLE_LINES)
    const selection = getTableSelection(model, {
      startLineNumber: 2,
      startColumn: 3,
      endLineNumber: 4,
      endColumn: 11,
    })

    expect(selection).not.toBeNull()
    expect(selection?.selectedRowIndices).toEqual([0, 1, 2])
    expect(selection?.selectedColIndices).toEqual([0, 1])
    expect(selection?.tableScope.startLine).toBe(2)
  })

  it('returns null selection outside table content', () => {
    const model = createModel(['plain text'])
    const selection = getTableSelection(model, {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 5,
    })

    expect(selection).toBeNull()
  })
})
