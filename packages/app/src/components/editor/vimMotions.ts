import type { CodeMirrorAdapter, VimMotionArgs } from './vimTypes'
import {
  findMarkdownFenceTarget,
  findQuoteTarget,
  findStandardBracketTarget,
} from './vimBracketHelpers'
import { isDisplayLineEnabledForEditor } from './vimDisplayLine'
import { type CursorHead, type VisibleLineBounds, vimMotionLineUtils } from './vimMotionLineUtils'
import { findMarkdownParagraphTargetLine } from './vimMotionParagraphUtils'

const runRepeatedEditorCommandMotion = (
  cm: CodeMirrorAdapter,
  head: CursorHead,
  repeat: number,
  command: string,
  payload: Record<string, unknown>
): CursorHead => {
  cm.editor.setPosition(vimMotionLineUtils.toMonacoPosition(head))

  for (let i = 0; i < repeat; i++) {
    cm.editor.trigger('vim', command, payload)
  }

  return vimMotionLineUtils.toHeadPosition(cm.editor.getPosition(), head)
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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const repeat = motionArgs.repeat || 1
  const command = motionArgs.forward ? 'cursorDown' : 'cursorUp'

  return runRepeatedEditorCommandMotion(cm, head, repeat, command, {})
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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const repeat = motionArgs.repeat || 1
  const to = motionArgs.forward ? 'down' : 'up'

  return runRepeatedEditorCommandMotion(cm, head, repeat, 'cursorMove', {
    to,
    by: 'line',
    value: 1,
  })
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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const bounds = vimMotionLineUtils.getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = motionArgs.repeat || 1
  const targetLineNumber = vimMotionLineUtils.clampLineNumber(
    bounds.startLineNumber + repeat - 1,
    bounds
  )
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, targetLineNumber)

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
  head: CursorHead
): CursorHead => {
  const bounds = vimMotionLineUtils.getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const targetLineNumber =
    bounds.startLineNumber + Math.floor((bounds.endLineNumber - bounds.startLineNumber) / 2)
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, targetLineNumber)

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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const bounds = vimMotionLineUtils.getTargetLineBounds(cm)
  if (!bounds) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = motionArgs.repeat || 1
  const targetLineNumber = vimMotionLineUtils.clampLineNumber(
    bounds.endLineNumber - repeat + 1,
    bounds
  )
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, targetLineNumber)

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
  head: CursorHead
): CursorHead => {
  const model = cm.editor.getModel()
  if (!model) {
    return { line: head.line, ch: head.ch }
  }

  const position = vimMotionLineUtils.toMonacoPosition(head)
  const lineContent = model.getLineContent(position.lineNumber)

  const fenceTarget = findMarkdownFenceTarget(model, position, lineContent)
  if (fenceTarget) {
    return fenceTarget
  }

  const quoteTarget = findQuoteTarget(lineContent, head)
  if (quoteTarget) {
    return quoteTarget
  }

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
  head: CursorHead
): CursorHead => {
  cm.editor.setPosition(vimMotionLineUtils.toMonacoPosition(head))
  cm.editor.trigger('vim', 'cursorHome', {})

  return vimMotionLineUtils.toHeadPosition(cm.editor.getPosition(), head)
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
  head: CursorHead
): CursorHead => {
  cm.editor.setPosition(vimMotionLineUtils.toMonacoPosition(head))
  cm.editor.trigger('vim', 'cursorEnd', {})

  const endPos = cm.editor.getPosition()
  if (endPos && endPos.column > 1) {
    cm.editor.trigger('vim', 'cursorLeft', {})
  }

  return vimMotionLineUtils.toHeadPosition(cm.editor.getPosition(), head)
}

/**
 * Vim motion that moves the cursor to the logical start of the current line.
 * @param _cm - The CodeMirror adapter wrapping the Monaco editor
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position
 */
export const moveToStartOfLogicalLineMotion = (
  _cm: CodeMirrorAdapter,
  head: CursorHead
): CursorHead => ({
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
  head: CursorHead
): CursorHead => {
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, head.line + 1)
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
  head: CursorHead,
  motionArgs: VimMotionArgs = {}
): CursorHead => {
  const repeatAdjustedHead = vimMotionLineUtils.withRepeatAdjustedHead(cm, head, motionArgs.repeat)
  const targetLineNumber = repeatAdjustedHead.line + 1
  const targetColumn = vimMotionLineUtils.getLogicalLineEndColumn(cm, targetLineNumber)

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
  head: CursorHead
): CursorHead => {
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
  head: CursorHead
): CursorHead => {
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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const repeatAdjustedHead = vimMotionLineUtils.withRepeatAdjustedHead(cm, head, motionArgs.repeat)

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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
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
  const targetLineNumber = vimMotionLineUtils.clampLineNumber(head.line + 1 + lineDelta, bounds)
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, targetLineNumber)

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
  head: CursorHead,
  motionArgs: VimMotionArgs
): CursorHead => {
  const model = cm.editor.getModel()
  if (!model) {
    return { line: head.line, ch: head.ch }
  }

  const repeat = Math.max(motionArgs.repeat || 1, 1)
  const moveForward = motionArgs.forward !== false
  const targetLine = findMarkdownParagraphTargetLine(model, head.line + 1, repeat, moveForward)
  const targetColumn = vimMotionLineUtils.getFirstNonWhitespaceColumn(cm, targetLine)

  return {
    line: targetLine - 1,
    ch: targetColumn - 1,
  }
}
