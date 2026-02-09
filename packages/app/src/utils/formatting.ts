import type { EditorPaneHandle } from '@/components/EditorPane'

interface LineFormattingOptions {
  editor: EditorPaneHandle
  placeholder: string
  transform: (lines: string[]) => string[]
  cursorAdjust?: {
    lineDelta?: number
    column?: number
  }
}

function insertTemplate(editor: EditorPaneHandle, prefix: string, suffix: string) {
  editor.insertText(prefix + suffix)
  const range = editor.getSelectionRange()
  if (range) {
    editor.setSelection({
      startLineNumber: range.endLineNumber,
      startColumn: range.endColumn - suffix.length,
      endLineNumber: range.endLineNumber,
      endColumn: range.endColumn - suffix.length,
    })
  }
}

function applyLineFormatting(options: LineFormattingOptions): void {
  const { editor, placeholder, transform } = options
  const range = editor.getSelectionRange()
  if (!range) return

  const { startLineNumber, endLineNumber } = range

  // Check if we are on a single empty line
  if (startLineNumber === endLineNumber) {
    const lineContent = editor.getLineContent(startLineNumber)
    if (lineContent === '' || lineContent === undefined) {
      editor.insertText(placeholder)
      if (options.cursorAdjust) {
        const range = editor.getSelectionRange()
        if (range) {
          const newLine = range.startLineNumber + (options.cursorAdjust.lineDelta || 0)
          const newCol = options.cursorAdjust.column ?? range.startColumn
          editor.setSelection({
            startLineNumber: newLine,
            startColumn: newCol,
            endLineNumber: newLine,
            endColumn: newCol,
          })
        }
      }
      return
    }
  }

  const lines: string[] = []
  for (let i = startLineNumber; i <= endLineNumber; i++) {
    lines.push(editor.getLineContent(i) || '')
  }

  const newLines = transform(lines)
  const newText = newLines.join('\n')

  const lastLineContent = editor.getLineContent(endLineNumber) || ''
  const lastLineLength = lastLineContent.length

  editor.setSelection({
    startLineNumber: startLineNumber,
    startColumn: 1,
    endLineNumber: endLineNumber,
    endColumn: lastLineLength + 1,
  })

  editor.replaceSelection(newText)
}

/**
 * Wraps selected text or inserts bold markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatBold(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`**${selection}**`)
  } else {
    insertTemplate(editor, '**', '**')
  }
}

/**
 * Wraps selected text or inserts italic markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatItalic(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`*${selection}*`)
  } else {
    insertTemplate(editor, '*', '*')
  }
}

/**
 * Wraps selected text or inserts link markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatLink(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`[${selection}](url)`)
  } else {
    insertTemplate(editor, '[', '](url)')
  }
}

/**
 * Wraps selected text or inserts inline code markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatCode(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`\`${selection}\``)
  } else {
    insertTemplate(editor, '`', '`')
  }
}

/**
 * Wraps selected text or inserts code block markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatCodeBlock(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '```\n\n```',
    cursorAdjust: {
      lineDelta: -1,
      column: 1,
    },
    transform: (lines) => {
      return ['```', ...lines, '```']
    },
  })
}

/**
 * Formats selected text or inserts heading markdown
 * @param editor - Editor instance handle
 * @param level - Heading level (1-6)
 * @returns void
 */
export function formatHeading(editor: EditorPaneHandle | null, level: number): void {
  if (!editor) return

  const prefix = '#'.repeat(level) + ' '

  applyLineFormatting({
    editor,
    placeholder: `${prefix}`,
    transform: (lines) =>
      lines.map((line) => {
        // Strip existing heading
        const cleanContent = line.replace(/^#{1,6}\s+/, '')
        return `${prefix}${cleanContent}`
      }),
  })
}

/**
 * Formats selected text or inserts blockquote markdown
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatQuote(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '> ',
    transform: (lines) =>
      lines.map((line) => {
        // Skip empty lines to avoid trailing > on selection end
        if (line.trim().length === 0) return line
        // We could strip existing quotes here if we wanted toggle behavior,
        // but preserving existing behavior of just adding > for now,
        // unless it's just a raw add.
        // Old implementation: lines.map((line, i) => (i === lines.length - 1 && line === '' ? line : `> ${line}`))
        // The helper reads actual lines. If line is empty, it's empty string.
        return `> ${line}`
      }),
  })
}

/**
 * Formats selected text as bullet list or removes existing bullet formatting
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatBulletList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '- ',
    transform: (lines) => {
      const processableLines = lines.filter((line) => line.trim().length > 0)
      const isBulletList =
        processableLines.length > 0 && processableLines.every((line) => /^\s*[-*]\s/.test(line))
      const isNumberedList =
        !isBulletList &&
        processableLines.length > 0 &&
        processableLines.every((line) => /^\s*\d+\.\s/.test(line))

      return lines.map((line) => {
        if (line.trim().length === 0) return line

        if (isBulletList) {
          return line.replace(/^(\s*)([-*]\s+)/, '$1')
        }
        if (isNumberedList) {
          return line.replace(/^(\s*)(\d+\.\s+)/, '$1- ')
        }
        return `- ${line}`
      })
    },
  })
}

/**
 * Formats selected text as numbered list or removes existing numbering
 * @param editor - Editor instance handle
 * @returns void
 */
export function formatNumberedList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '1. ',
    transform: (lines) => {
      const processableLines = lines.filter((line) => line.trim().length > 0)
      const isNumberedList =
        processableLines.length > 0 && processableLines.every((line) => /^\s*\d+\.\s/.test(line))
      const isBulletList =
        !isNumberedList &&
        processableLines.length > 0 &&
        processableLines.every((line) => /^\s*[-*]\s/.test(line))

      let counter = 1
      return lines.map((line) => {
        if (line.trim().length === 0) return line

        if (isNumberedList) {
          return line.replace(/^(\s*)(\d+\.\s+)/, '$1')
        }

        const prefix = `${counter++}. `
        if (isBulletList) {
          return line.replace(/^(\s*)([-*]\s+)/, `$1${prefix}`)
        }
        return `${prefix}${line}`
      })
    },
  })
}

export interface AutoContinueResult {
  action: 'exit' | 'continue'
  text?: string
  range: {
    lineNumber?: number // Relative to current line (0)
    startColumn: number
    endColumn: number
  }
}

/**
 * Determines the auto-continuation action for lists and quotes when pressing Enter
 * @param lineContent - The content of the current line
 * @param cursorColumn - The 1-based column position of the cursor
 * @returns The auto-continuation result or null if no action is needed
 */
export function getAutoContinueEdit(
  lineContent: string,
  cursorColumn: number
): AutoContinueResult | null {
  // text before cursor
  const beforeCursor = lineContent.substring(0, cursorColumn - 1)

  // Patterns
  const unorderedListPattern = /^(\s*)[-*+]\s+$/
  const unorderedListContentPattern = /^(\s*)([-*+])\s+(.+)/
  const orderedListPattern = /^(\s*)(\d+)\.\s+$/
  const orderedListContentPattern = /^(\s*)(\d+)\.\s+(.+)/
  const quotePattern = /^(\s*)>\s?$/
  const quoteContentPattern = /^(\s*)>\s(.+)/

  // Check for empty list/quote (to exit)
  if (
    unorderedListPattern.test(beforeCursor) ||
    orderedListPattern.test(beforeCursor) ||
    quotePattern.test(beforeCursor)
  ) {
    return {
      action: 'exit',
      range: {
        startColumn: 1,
        endColumn: cursorColumn,
      },
    }
  }

  // Check for content (to continue)
  const ulMatch = beforeCursor.match(unorderedListContentPattern)
  if (ulMatch) {
    const indent = ulMatch[1]
    const prefix = ulMatch[2] // Capture the exact bullet used
    return {
      action: 'continue',
      text: `\n${indent}${prefix} `,
      range: {
        startColumn: cursorColumn,
        endColumn: cursorColumn,
      },
    }
  }

  const olMatch = beforeCursor.match(orderedListContentPattern)
  if (olMatch) {
    const indent = olMatch[1]
    const number = parseInt(olMatch[2], 10)
    return {
      action: 'continue',
      text: `\n${indent}${number + 1}. `,
      range: {
        startColumn: cursorColumn,
        endColumn: cursorColumn,
      },
    }
  }

  const quoteMatch = beforeCursor.match(quoteContentPattern)
  if (quoteMatch) {
    const indent = quoteMatch[1]
    return {
      action: 'continue',
      text: `\n${indent}> `,
      range: {
        startColumn: cursorColumn,
        endColumn: cursorColumn,
      },
    }
  }

  return null
}
