import type { EditorPaneHandle } from '@/components/EditorPane'

interface LineFormattingOptions {
  editor: EditorPaneHandle
  placeholder: string
  transform: (lines: string[]) => string[]
}

function applyLineFormatting({ editor, placeholder, transform }: LineFormattingOptions): void {
  const range = editor.getSelectionRange()
  if (!range) return

  const { startLineNumber, endLineNumber } = range

  // Check if we are on a single empty line
  if (startLineNumber === endLineNumber) {
    const lineContent = editor.getLineContent(startLineNumber)
    if (lineContent === '' || lineContent === undefined) {
      editor.insertText(placeholder)
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
 */
export function formatBold(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`**${selection}**`)
  } else {
    editor.insertText('**bold**')
  }
}

/**
 * Wraps selected text or inserts italic markdown
 * @param editor - Editor instance handle
 */
export function formatItalic(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`*${selection}*`)
  } else {
    editor.insertText('*italic*')
  }
}

/**
 * Wraps selected text or inserts link markdown
 * @param editor - Editor instance handle
 */
export function formatLink(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`[${selection}](url)`)
  } else {
    editor.insertText('[link](url)')
  }
}

/**
 * Wraps selected text or inserts inline code markdown
 * @param editor - Editor instance handle
 */
export function formatCode(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`\`${selection}\``)
  } else {
    editor.insertText('`code`')
  }
}

/**
 * Wraps selected text or inserts code block markdown
 * @param editor - Editor instance handle
 */
export function formatCodeBlock(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '```\ncode block\n```',
    transform: (lines) => {
      return ['```', ...lines, '```']
    },
  })
}

/**
 * Formats selected text or inserts heading markdown
 * @param editor - Editor instance handle
 * @param level - Heading level (1-6)
 */
export function formatHeading(editor: EditorPaneHandle | null, level: number): void {
  if (!editor) return

  const prefix = '#'.repeat(level) + ' '

  applyLineFormatting({
    editor,
    placeholder: `${prefix}heading`,
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
 */
export function formatQuote(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '> quote',
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
 */
export function formatBulletList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '- item',
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
 */
export function formatNumberedList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  applyLineFormatting({
    editor,
    placeholder: '1. item',
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
