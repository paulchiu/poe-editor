import type { editor } from 'monaco-editor'
import type { CodeMirrorAdapter } from './vimTypes'

/** Mapping of smart (curly) quote characters to their matching counterpart. */
const SMART_QUOTES: Readonly<Record<SmartQuoteChar, SmartQuoteChar>> = {
  '\u201C': '\u201D', // " -> "
  '\u201D': '\u201C', // " -> "
  '\u2018': '\u2019', // ' -> '
  '\u2019': '\u2018', // ' -> '
}

/** Characters that form smart quote pairs. */
type SmartQuoteChar = '\u201C' | '\u201D' | '\u2018' | '\u2019'

const SIMPLE_QUOTES = ["'", '"', '`'] as const

const FENCE_REGEX = /^\s*(`{3,}|~{3,})/

/**
 * Finds the matching markdown fence (``` or ~~~) for the fence at the given position.
 * @param model - The Monaco text model
 * @param position - The 1-indexed line position to check
 * @param lineContent - The text content of the current line
 * @returns The 0-indexed target position, or null if not on a fence line
 */
export const findMarkdownFenceTarget = (
  model: editor.ITextModel,
  position: { lineNumber: number },
  lineContent: string
): { line: number; ch: number } | null => {
  if (!FENCE_REGEX.test(lineContent)) return null

  // Determine if this is a start or end fence by counting fences from the beginning
  const fenceCount = countFencesUpToLine(model, position.lineNumber)
  const isStartFence = fenceCount % 2 !== 0

  const targetLine = isStartFence
    ? findNextFence(model, position.lineNumber + 1)
    : findPreviousFence(model, position.lineNumber - 1)

  if (targetLine !== -1) {
    // Return 0-indexed position for Vim
    return { line: targetLine - 1, ch: 0 }
  }

  return null
}

/**
 * Finds the matching quote character on the same line.
 * Supports simple quotes (', ", `) and smart/curly quotes.
 * @param lineContent - The text content of the current line
 * @param head - The 0-indexed cursor position
 * @returns The 0-indexed target position, or null if not on a quote character
 */
export const findQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number }
): { line: number; ch: number } | null => {
  const char = lineContent[head.ch]

  if (SIMPLE_QUOTES.includes(char as (typeof SIMPLE_QUOTES)[number])) {
    return findSimpleQuoteTarget(lineContent, head, char)
  }

  if (isSmartQuoteChar(char)) {
    return findSmartQuoteTarget(lineContent, head, char)
  }

  return null
}

/**
 * Finds the matching bracket using Monaco's native jumpToBracket action.
 * @param cm - The CodeMirror adapter wrapping the Monaco editor
 * @param position - The 1-indexed Monaco position
 * @param head - The 0-indexed cursor position as fallback
 * @returns The 0-indexed target position
 */
export const findStandardBracketTarget = (
  cm: CodeMirrorAdapter,
  position: { lineNumber: number; column: number },
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  cm.editor.setPosition(position)
  cm.editor.trigger('vim', 'editor.action.jumpToBracket', {})
  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }
  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}

// --- Internal helpers ---

const isSmartQuoteChar = (char: string): char is SmartQuoteChar => {
  return char in SMART_QUOTES
}

const countFencesUpToLine = (model: editor.ITextModel, lineNumber: number): number => {
  let fenceCount = 0
  for (let i = 1; i <= lineNumber; i++) {
    if (FENCE_REGEX.test(model.getLineContent(i))) {
      fenceCount++
    }
  }
  return fenceCount
}

const findNextFence = (model: editor.ITextModel, startLine: number): number => {
  for (let i = startLine; i <= model.getLineCount(); i++) {
    if (FENCE_REGEX.test(model.getLineContent(i))) {
      return i
    }
  }
  return -1
}

const findPreviousFence = (model: editor.ITextModel, startLine: number): number => {
  for (let i = startLine; i >= 1; i--) {
    if (FENCE_REGEX.test(model.getLineContent(i))) {
      return i
    }
  }
  return -1
}

const findSimpleQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number },
  char: string
): { line: number; ch: number } | null => {
  const positions: number[] = []
  for (let i = 0; i < lineContent.length; i++) {
    if (lineContent[i] === char) {
      // Skip escaped quotes (except backticks which can't be escaped)
      if (char !== '`' && i > 0 && lineContent[i - 1] === '\\') {
        continue
      }
      positions.push(i)
    }
  }

  const currentIndex = positions.indexOf(head.ch)
  if (currentIndex !== -1) {
    // Even index (0, 2, ..) -> opening quote -> jump forward
    // Odd index (1, 3, ..) -> closing quote -> jump backward
    const targetIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1

    if (targetIndex >= 0 && targetIndex < positions.length) {
      return { line: head.line, ch: positions[targetIndex] }
    }
  }
  return null
}

const findSmartQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number },
  char: SmartQuoteChar
): { line: number; ch: number } | null => {
  const targetChar = SMART_QUOTES[char]
  const isStart = char === '\u201C' || char === '\u2018'

  const targetCol = isStart
    ? lineContent.indexOf(targetChar, head.ch + 1)
    : lineContent.lastIndexOf(targetChar, head.ch - 1)

  if (targetCol !== -1) {
    return { line: head.line, ch: targetCol }
  }
  return null
}
