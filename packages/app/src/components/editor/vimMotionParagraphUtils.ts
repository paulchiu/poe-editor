interface ParagraphModel {
  getLineContent: (lineNumber: number) => string
  getLineCount: () => number
}

const PARAGRAPH_SEPARATOR_PATTERN = /^\s*$/
const MARKDOWN_BLOCK_START_PATTERN =
  /^\s{0,3}(?:#{1,6}\s+|>+\s?|(?:[-*+]\s+|\d+\.\s+)|(?:```|~~~)|(?:[-*_]\s*){3,})/

const isParagraphSeparatorLine = (lineContent: string): boolean =>
  PARAGRAPH_SEPARATOR_PATTERN.test(lineContent)

const isMarkdownBlockStartLine = (lineContent: string): boolean =>
  MARKDOWN_BLOCK_START_PATTERN.test(lineContent)

const findParagraphContentStart = (model: ParagraphModel, line: number): number => {
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

const findNextParagraphStart = (model: ParagraphModel, currentLine: number): number => {
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

const findPreviousParagraphStart = (model: ParagraphModel, currentLine: number): number => {
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

/**
 * Resolves the destination line for markdown-aware paragraph movement.
 * @param model - Monaco text model accessor for lines and line count
 * @param startLine - Starting 1-indexed line number
 * @param repeat - Number of paragraph jumps to perform
 * @param moveForward - True to move forward, false to move backward
 * @returns The clamped 1-indexed destination line
 */
export const findMarkdownParagraphTargetLine = (
  model: ParagraphModel,
  startLine: number,
  repeat: number,
  moveForward: boolean
): number => {
  const lineCount = model.getLineCount()
  let targetLine = startLine

  for (let i = 0; i < repeat; i++) {
    targetLine = moveForward
      ? findNextParagraphStart(model, targetLine + 1)
      : findPreviousParagraphStart(model, targetLine - 1)
  }

  return Math.min(Math.max(targetLine, 1), lineCount)
}
