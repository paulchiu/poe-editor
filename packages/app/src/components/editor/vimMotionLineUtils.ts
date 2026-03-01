import type { CodeMirrorAdapter } from './vimTypes'

export interface VisibleLineBounds {
  startLineNumber: number
  endLineNumber: number
}

export interface CursorHead {
  line: number
  ch: number
}

interface MonacoPosition {
  lineNumber: number
  column: number
}

const clampLineNumber = (lineNumber: number, bounds: VisibleLineBounds): number =>
  Math.min(Math.max(lineNumber, bounds.startLineNumber), bounds.endLineNumber)

const getFirstNonWhitespaceColumn = (cm: CodeMirrorAdapter, lineNumber: number): number => {
  const model = cm.editor.getModel()
  if (!model) {
    return 1
  }

  const firstNonWhitespaceColumn = model.getLineFirstNonWhitespaceColumn(lineNumber)
  return firstNonWhitespaceColumn > 0 ? firstNonWhitespaceColumn : 1
}

const getTargetLineBounds = (cm: CodeMirrorAdapter): VisibleLineBounds | null => {
  const model = cm.editor.getModel()
  if (!model) {
    return null
  }

  const visibleRanges = cm.editor.getVisibleRanges()
  const visibleRange = visibleRanges[0]
  if (!visibleRange) {
    return null
  }

  const totalLineCount = model.getLineCount()
  const visibleLineCount = visibleRange.endLineNumber - visibleRange.startLineNumber + 1

  if (totalLineCount <= visibleLineCount) {
    return { startLineNumber: 1, endLineNumber: totalLineCount }
  }

  return {
    startLineNumber: visibleRange.startLineNumber,
    endLineNumber: visibleRange.endLineNumber,
  }
}

const getModelLineBounds = (cm: CodeMirrorAdapter): VisibleLineBounds | null => {
  const model = cm.editor.getModel()
  if (!model) {
    return null
  }

  return {
    startLineNumber: 1,
    endLineNumber: model.getLineCount(),
  }
}

const withRepeatAdjustedHead = (
  cm: CodeMirrorAdapter,
  head: CursorHead,
  repeat?: number
): CursorHead => {
  if (!repeat || repeat <= 1) {
    return head
  }

  const bounds = getModelLineBounds(cm)
  if (!bounds) {
    return head
  }

  const targetLineNumber = clampLineNumber(head.line + repeat, bounds)
  return {
    line: targetLineNumber - 1,
    ch: head.ch,
  }
}

const getLogicalLineEndColumn = (cm: CodeMirrorAdapter, lineNumber: number): number => {
  const model = cm.editor.getModel()
  if (!model) {
    return 1
  }

  const lineMaxColumn = model.getLineMaxColumn(lineNumber)
  return lineMaxColumn > 1 ? lineMaxColumn - 1 : 1
}

const toMonacoPosition = (head: CursorHead): MonacoPosition => ({
  lineNumber: head.line + 1,
  column: head.ch + 1,
})

const toHeadPosition = (
  position: MonacoPosition | null | undefined,
  fallback: CursorHead
): CursorHead => {
  if (!position) {
    return fallback
  }

  return {
    line: position.lineNumber - 1,
    ch: position.column - 1,
  }
}

export const vimMotionLineUtils = {
  clampLineNumber,
  getFirstNonWhitespaceColumn,
  getTargetLineBounds,
  getModelLineBounds,
  withRepeatAdjustedHead,
  getLogicalLineEndColumn,
  toMonacoPosition,
  toHeadPosition,
}
