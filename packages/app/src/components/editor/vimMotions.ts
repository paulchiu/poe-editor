import type { CodeMirrorAdapter } from './vimTypes'
import {
  findMarkdownFenceTarget,
  findQuoteTarget,
  findStandardBracketTarget,
} from './vimBracketHelpers'

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
