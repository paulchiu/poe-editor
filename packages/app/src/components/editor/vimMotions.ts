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
