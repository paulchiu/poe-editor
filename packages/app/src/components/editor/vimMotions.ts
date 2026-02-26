import type { CodeMirrorAdapter } from './vimTypes'
import {
  findMarkdownFenceTarget,
  findQuoteTarget,
  findStandardBracketTarget,
} from './vimBracketHelpers'

interface VisibleLineBounds {
  startLineNumber: number
  endLineNumber: number
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

/**
 * Vim motion that moves the cursor by display (wrapped) lines using Monaco's native cursor movement.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including repeat count and direction
 * @returns The 0-indexed target position
 */
export const moveByDisplayLinesMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: { repeat?: number; forward?: boolean }
): { line: number; ch: number } => {
  // Line/ch are 0-indexed in CM, 1-indexed in Monaco
  const startPos = { lineNumber: head.line + 1, column: head.ch + 1 }
  cm.editor.setPosition(startPos)

  const repeat = motionArgs.repeat || 1
  const command = motionArgs.forward ? 'cursorDown' : 'cursorUp'

  for (let i = 0; i < repeat; i++) {
    cm.editor.trigger('vim', command, {})
  }

  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }

  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}

/**
 * Vim motion that jumps to a high document position.
 * Uses viewport-relative lines when the file is taller than the viewport,
 * otherwise uses the whole document.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including optional repeat count
 * @returns { { line: number; ch: number } } The 0-indexed target position
 */
export const moveToHighDocumentPositionMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: { repeat?: number }
): { line: number; ch: number } => {
  const bounds = getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = motionArgs.repeat || 1
  const targetLineNumber = clampLineNumber(bounds.startLineNumber + repeat - 1, bounds)
  const targetColumn = getFirstNonWhitespaceColumn(cm, targetLineNumber)

  return { line: targetLineNumber - 1, ch: targetColumn - 1 }
}

/**
 * Vim motion that jumps to a middle document position.
 * Uses viewport-relative lines when the file is taller than the viewport,
 * otherwise uses the whole document.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns { { line: number; ch: number } } The 0-indexed target position
 */
export const moveToMiddleDocumentPositionMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  const bounds = getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const targetLineNumber =
    bounds.startLineNumber + Math.floor((bounds.endLineNumber - bounds.startLineNumber) / 2)
  const targetColumn = getFirstNonWhitespaceColumn(cm, targetLineNumber)

  return { line: targetLineNumber - 1, ch: targetColumn - 1 }
}

/**
 * Vim motion that jumps to a low document position.
 * Uses viewport-relative lines when the file is taller than the viewport,
 * otherwise uses the whole document.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including optional repeat count
 * @returns { { line: number; ch: number } } The 0-indexed target position
 */
export const moveToLowDocumentPositionMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: { repeat?: number }
): { line: number; ch: number } => {
  const bounds = getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = motionArgs.repeat || 1
  const targetLineNumber = clampLineNumber(bounds.endLineNumber - repeat + 1, bounds)
  const targetColumn = getFirstNonWhitespaceColumn(cm, targetLineNumber)

  return { line: targetLineNumber - 1, ch: targetColumn - 1 }
}

/**
 * Vim motion that jumps to the matching bracket, quote, or markdown fence.
 * Tries markdown fences first, then quotes, then standard bracket matching.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToMatchingBracketMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  const model = cm.editor.getModel()
  if (!model) return { line: head.line, ch: head.ch }

  const position = { lineNumber: head.line + 1, column: head.ch + 1 }
  const lineContent = model.getLineContent(position.lineNumber)

  // 1. Try Markdown Fences
  const fenceTarget = findMarkdownFenceTarget(model, position, lineContent)
  if (fenceTarget) return fenceTarget

  // 2. Try Quotes
  const quoteTarget = findQuoteTarget(lineContent, head)
  if (quoteTarget) return quoteTarget

  // 3. Fallback to standard bracket jumping
  return findStandardBracketTarget(cm, position, head)
}

/**
 * Vim motion that moves the cursor to the start of the display (wrapped) line.
 * Uses Monaco's native cursorHome command which respects line wrapping.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns { { line: number; ch: number } } The 0-indexed target position
 */
export const moveToStartOfDisplayLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  // Sync Monaco position
  const startPos = { lineNumber: head.line + 1, column: head.ch + 1 }
  cm.editor.setPosition(startPos)

  // Trigger 'cursorHome' which usually handles display lines
  cm.editor.trigger('vim', 'cursorHome', {})

  // Return new position
  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }
  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}

/**
 * Vim motion that moves the cursor to the end of the display (wrapped) line.
 * Uses Monaco's native cursorEnd command which respects line wrapping.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns { { line: number; ch: number } } The 0-indexed target position
 */
export const moveToEndOfDisplayLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  // Sync Monaco position
  const startPos = { lineNumber: head.line + 1, column: head.ch + 1 }
  cm.editor.setPosition(startPos)

  // Trigger 'cursorEnd' which usually handles display lines
  cm.editor.trigger('vim', 'cursorEnd', {})

  // cursorEnd moves to the position *after* the last character of the visual line.
  // In Vim, $ (and g$) usually places the cursor *on* the last character.
  // If we don't move left, the selection includes the character after the line end
  // (which might be the start of the next visual line or the newline).
  const endPos = cm.editor.getPosition()
  if (endPos && endPos.column > 1) {
    cm.editor.trigger('vim', 'cursorLeft', {})
  }

  // Return new position
  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }
  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}
