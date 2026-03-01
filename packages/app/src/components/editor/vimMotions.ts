import type { CodeMirrorAdapter, VimMotionArgs } from './vimTypes'
import {
  findMarkdownFenceTarget,
  findQuoteTarget,
  findStandardBracketTarget,
} from './vimBracketHelpers'
import { isDisplayLineEnabledForEditor } from './vimDisplayLine'

interface VisibleLineBounds {
  startLineNumber: number
  endLineNumber: number
}

const PARAGRAPH_SEPARATOR_PATTERN = /^\s*$/
const MARKDOWN_BLOCK_START_PATTERN =
  /^\s{0,3}(?:#{1,6}\s+|>+\s?|(?:[-*+]\s+|\d+\.\s+)|(?:```|~~~)|(?:[-*_]\s*){3,})/

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
  head: { line: number; ch: number },
  repeat?: number
): { line: number; ch: number } => {
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

const isParagraphSeparatorLine = (lineContent: string): boolean =>
  PARAGRAPH_SEPARATOR_PATTERN.test(lineContent)

const isMarkdownBlockStartLine = (lineContent: string): boolean =>
  MARKDOWN_BLOCK_START_PATTERN.test(lineContent)

const findParagraphContentStart = (
  model: { getLineContent: (lineNumber: number) => string },
  line: number
): number => {
  let currentLine = line

  while (currentLine > 1) {
    const previousLine = model.getLineContent(currentLine - 1)
    if (isParagraphSeparatorLine(previousLine)) {
      break
    }
    if (isMarkdownBlockStartLine(previousLine)) {
      return currentLine - 1
    }
    currentLine -= 1
  }

  return currentLine
}

const findNextParagraphStart = (
  model: { getLineContent: (lineNumber: number) => string; getLineCount: () => number },
  currentLine: number
): number => {
  const lineCount = model.getLineCount()
  let line = Math.min(Math.max(currentLine, 1), lineCount)

  while (line <= lineCount) {
    const lineContent = model.getLineContent(line)

    if (isMarkdownBlockStartLine(lineContent)) {
      return line
    }

    if (isParagraphSeparatorLine(lineContent)) {
      while (line <= lineCount && isParagraphSeparatorLine(model.getLineContent(line))) {
        line += 1
      }
      if (line > lineCount) {
        return lineCount
      }
      return isMarkdownBlockStartLine(model.getLineContent(line))
        ? line
        : findParagraphContentStart(model, line)
    }

    line += 1
  }

  return lineCount
}

const findPreviousParagraphStart = (
  model: { getLineContent: (lineNumber: number) => string; getLineCount: () => number },
  currentLine: number
): number => {
  const lineCount = model.getLineCount()
  let line = Math.min(Math.max(currentLine, 1), lineCount)

  while (line >= 1) {
    const lineContent = model.getLineContent(line)

    if (isMarkdownBlockStartLine(lineContent)) {
      return line
    }

    if (isParagraphSeparatorLine(lineContent)) {
      while (line >= 1 && isParagraphSeparatorLine(model.getLineContent(line))) {
        line -= 1
      }
      if (line < 1) {
        return 1
      }
      return isMarkdownBlockStartLine(model.getLineContent(line))
        ? line
        : findParagraphContentStart(model, line)
    }

    line -= 1
  }

  return 1
}

const getLogicalLineEndColumn = (cm: CodeMirrorAdapter, lineNumber: number): number => {
  const model = cm.editor.getModel()
  if (!model) {
    return 1
  }

  const lineMaxColumn = model.getLineMaxColumn(lineNumber)
  return lineMaxColumn > 1 ? lineMaxColumn - 1 : 1
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
  motionArgs: VimMotionArgs
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
 * Vim motion that moves the cursor by logical model lines (not wrapped display lines).
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including repeat count and direction
 * @returns The 0-indexed target position
 */
export const moveByLogicalLinesMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs
): { line: number; ch: number } => {
  const startPos = { lineNumber: head.line + 1, column: head.ch + 1 }
  cm.editor.setPosition(startPos)

  const repeat = motionArgs.repeat || 1
  const to = motionArgs.forward ? 'down' : 'up'

  for (let i = 0; i < repeat; i++) {
    cm.editor.trigger('vim', 'cursorMove', { to, by: 'line', value: 1 })
  }

  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }

  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}

/**
 * Vim motion that follows displayline option for vertical movement.
 * Uses display lines when enabled, otherwise logical model lines.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including repeat count and direction
 * @returns The 0-indexed target position
 */
export const moveByConfigurableLinesMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs
): { line: number; ch: number } => {
  if (isDisplayLineEnabledForEditor(cm.editor)) {
    return moveByDisplayLinesMotion(cm, head, motionArgs)
  }

  return moveByLogicalLinesMotion(cm, head, motionArgs)
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
  motionArgs: VimMotionArgs
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
  motionArgs: VimMotionArgs
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

/**
 * Vim motion that moves the cursor to the logical start of the current line.
 * @param _cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToStartOfLogicalLineMotion = (
  _cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => ({
  line: head.line,
  ch: 0,
})

/**
 * Vim motion that moves the cursor to the first non-whitespace character of the logical line.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToFirstNonWhitespaceLogicalLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  const targetColumn = getFirstNonWhitespaceColumn(cm, head.line + 1)
  return {
    line: head.line,
    ch: targetColumn - 1,
  }
}

/**
 * Vim motion that moves the cursor to the logical end of the line.
 * Supports Vim-style counts by applying the motion to a line below the cursor.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including optional repeat count
 * @returns The 0-indexed target position
 */
export const moveToEndOfLogicalLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs = {}
): { line: number; ch: number } => {
  const repeatAdjustedHead = withRepeatAdjustedHead(cm, head, motionArgs.repeat)
  const targetLineNumber = repeatAdjustedHead.line + 1
  const targetColumn = getLogicalLineEndColumn(cm, targetLineNumber)

  return {
    line: repeatAdjustedHead.line,
    ch: targetColumn - 1,
  }
}

/**
 * Vim motion that conditionally targets logical or display line start based on the displayline option.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToStartOfConfigurableLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  if (isDisplayLineEnabledForEditor(cm.editor)) {
    return moveToStartOfDisplayLineMotion(cm, head)
  }

  return moveToStartOfLogicalLineMotion(cm, head)
}

/**
 * Vim motion that conditionally targets logical or display first non-blank column based on displayline.
 * When displayline is enabled, it aligns with display-line start behavior.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToFirstNonWhitespaceConfigurableLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  if (isDisplayLineEnabledForEditor(cm.editor)) {
    return moveToStartOfDisplayLineMotion(cm, head)
  }

  return moveToFirstNonWhitespaceLogicalLineMotion(cm, head)
}

/**
 * Vim motion that conditionally targets logical or display line end based on the displayline option.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including optional repeat count
 * @returns The 0-indexed target position
 */
export const moveToEndOfConfigurableLineMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs
): { line: number; ch: number } => {
  const repeatAdjustedHead = withRepeatAdjustedHead(cm, head, motionArgs.repeat)

  if (isDisplayLineEnabledForEditor(cm.editor)) {
    return moveToEndOfDisplayLineMotion(cm, repeatAdjustedHead)
  }

  return moveToEndOfLogicalLineMotion(cm, repeatAdjustedHead)
}

/**
 * Vim motion used for +, -, and _ to move by logical lines and land on first non-whitespace.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including repeat count and direction controls
 * @returns The 0-indexed target position
 */
export const moveToRelativeLineStartMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs
): { line: number; ch: number } => {
  const model = cm.editor.getModel()
  if (!model) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = Math.max(motionArgs.repeat || 1, 1)
  const direction = motionArgs.direction || 0
  const lineDelta = motionArgs.anchorCurrent ? repeat - 1 : direction * repeat
  const bounds: VisibleLineBounds = {
    startLineNumber: 1,
    endLineNumber: model.getLineCount(),
  }
  const targetLineNumber = clampLineNumber(head.line + 1 + lineDelta, bounds)
  const targetColumn = getFirstNonWhitespaceColumn(cm, targetLineNumber)

  return {
    line: targetLineNumber - 1,
    ch: targetColumn - 1,
  }
}

/**
 * Vim motion that moves to previous/next markdown-aware paragraph boundaries.
 * Recognizes blank lines and markdown block starts as paragraph transitions.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @param motionArgs - Motion arguments including repeat count and direction
 * @returns The 0-indexed target position
 */
export const moveByMarkdownParagraphMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: VimMotionArgs
): { line: number; ch: number } => {
  const model = cm.editor.getModel()
  if (!model) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = Math.max(motionArgs.repeat || 1, 1)
  const moveForward = motionArgs.forward !== false
  const lineCount = model.getLineCount()

  let targetLine = head.line + 1

  for (let i = 0; i < repeat; i++) {
    targetLine = moveForward
      ? findNextParagraphStart(model, targetLine + 1)
      : findPreviousParagraphStart(model, targetLine - 1)
  }

  const clampedTargetLine = Math.min(Math.max(targetLine, 1), lineCount)
  const targetColumn = getFirstNonWhitespaceColumn(cm, clampedTargetLine)

  return {
    line: clampedTargetLine - 1,
    ch: targetColumn - 1,
  }
}
