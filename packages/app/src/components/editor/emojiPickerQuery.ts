const EMOJI_SHORTCODE_TOKEN_PATTERN = /:[a-zA-Z0-9_+-]*$/
const COMPLETED_EMOJI_SHORTCODE_PATTERN = /:[a-zA-Z0-9_+-]+:$/
const EMOJI_SHORTCODE_BOUNDARY_PATTERN = /[a-zA-Z0-9_+-:]/
const MARKDOWN_FENCE_PATTERN = /^\s{0,3}(`{3,}|~{3,})/

type FenceMarker = '`' | '~'

interface FenceState {
  marker: FenceMarker
  length: number
}

interface EmojiShortcodeTextModel {
  getLineContent: (lineNumber: number) => string
}

interface EmojiCursorPosition {
  lineNumber: number
  column: number
}

/**
 * Active shortcode query details at the cursor.
 */
export interface EmojiShortcodeMatch {
  query: string
  lineNumber: number
  startColumn: number
  endColumn: number
}

function isInsideInlineCode(linePrefix: string, tokenStartIndex: number): boolean {
  let unescapedBacktickCount = 0
  for (let index = 0; index < tokenStartIndex; index += 1) {
    if (linePrefix[index] !== '`') continue
    if (index > 0 && linePrefix[index - 1] === '\\') continue
    unescapedBacktickCount += 1
  }

  return unescapedBacktickCount % 2 === 1
}

function getFenceStateForLineSegment(
  currentFenceState: FenceState | null,
  lineSegment: string
): FenceState | null {
  const match = lineSegment.match(MARKDOWN_FENCE_PATTERN)
  if (!match) return currentFenceState

  const marker = match[1][0] as FenceMarker
  const length = match[1].length

  if (!currentFenceState) {
    return { marker, length }
  }

  if (currentFenceState.marker === marker && length >= currentFenceState.length) {
    return null
  }

  return currentFenceState
}

/**
 * Determines whether the cursor is currently inside a fenced markdown code block.
 * @param model - Monaco text model-like object.
 * @param position - Current cursor position.
 * @returns True when inside an open fenced code block.
 */
export function isInsideFencedCodeBlock(
  model: EmojiShortcodeTextModel,
  position: EmojiCursorPosition
): boolean {
  let fenceState: FenceState | null = null

  for (let lineNumber = 1; lineNumber <= position.lineNumber; lineNumber += 1) {
    const fullLine = model.getLineContent(lineNumber)
    const lineSegment =
      lineNumber === position.lineNumber
        ? fullLine.slice(0, Math.max(0, position.column - 1))
        : fullLine
    fenceState = getFenceStateForLineSegment(fenceState, lineSegment)
  }

  return fenceState !== null
}

/**
 * Returns the active emoji shortcode query under the cursor.
 * Skips escaped patterns and inline/fenced code contexts.
 *
 * @param model - Monaco text model-like object.
 * @param position - Current cursor position.
 * @returns Match details for replacement, or null when no active query is present.
 */
export function getEmojiShortcodeQueryAtCursor(
  model: EmojiShortcodeTextModel,
  position: EmojiCursorPosition
): EmojiShortcodeMatch | null {
  const line = model.getLineContent(position.lineNumber)
  const linePrefix = line.slice(0, Math.max(0, position.column - 1))
  if (COMPLETED_EMOJI_SHORTCODE_PATTERN.test(linePrefix)) return null
  const match = linePrefix.match(EMOJI_SHORTCODE_TOKEN_PATTERN)
  if (!match) return null

  const token = match[0]
  const tokenStartIndex = linePrefix.length - token.length

  if (tokenStartIndex > 0) {
    const previousChar = linePrefix[tokenStartIndex - 1]
    if (previousChar === '\\') return null
    if (EMOJI_SHORTCODE_BOUNDARY_PATTERN.test(previousChar)) return null
  }

  if (isInsideInlineCode(linePrefix, tokenStartIndex)) return null
  if (isInsideFencedCodeBlock(model, position)) return null

  return {
    query: token.slice(1).toLowerCase(),
    lineNumber: position.lineNumber,
    startColumn: tokenStartIndex + 1,
    endColumn: position.column,
  }
}
