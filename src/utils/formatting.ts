import type { EditorPaneHandle } from '@/components/EditorPane'

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

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`\`\`\`\n${selection}\n\`\`\``)
  } else {
    editor.insertText('```\ncode block\n```')
  }
}

/**
 * Formats selected text or inserts heading markdown
 * @param editor - Editor instance handle
 * @param level - Heading level (1-6)
 */
export function formatHeading(editor: EditorPaneHandle | null, level: number): void {
  if (!editor) return

  const prefix = '#'.repeat(level) + ' '
  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`${prefix}${selection}`)
  } else {
    editor.insertText(`${prefix}heading`)
  }
}

/**
 * Formats selected text or inserts blockquote markdown
 * @param editor - Editor instance handle
 */
export function formatQuote(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    const lines = selection.split('\n')
    const formatted = lines
      .map((line, i) => (i === lines.length - 1 && line === '' ? line : `> ${line}`))
      .join('\n')
    editor.replaceSelection(formatted)
  } else {
    editor.insertText('> quote')
  }
}

/**
 * Formats selected text as bullet list or removes existing bullet formatting
 * @param editor - Editor instance handle
 */
export function formatBulletList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    const lines = selection.split('\n')
    const processableLines = lines.filter(
      (line: string, i: number) =>
        !(i === lines.length - 1 && line === '') && line.trim().length > 0
    )

    const isBulletList =
      processableLines.length > 0 &&
      processableLines.every((line: string) => /^\s*[-*]\s/.test(line))
    const isNumberedList =
      !isBulletList &&
      processableLines.length > 0 &&
      processableLines.every((line: string) => /^\s*\d+\.\s/.test(line))

    const formatted = lines
      .map((line: string, i: number) => {
        if (i === lines.length - 1 && line === '') return line
        if (line.trim().length === 0) return line

        if (isBulletList) {
          return line.replace(/^(\s*)([-*]\s+)/, '$1')
        }
        if (isNumberedList) {
          return line.replace(/^(\s*)(\d+\.\s+)/, '$1- ')
        }
        return `- ${line}`
      })
      .join('\n')
    editor.replaceSelection(formatted)
  } else {
    editor.insertText('- item')
  }
}

/**
 * Formats selected text as numbered list or removes existing numbering
 * @param editor - Editor instance handle
 */
export function formatNumberedList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    const lines = selection.split('\n')
    const processableLines = lines.filter(
      (line: string, i: number) =>
        !(i === lines.length - 1 && line === '') && line.trim().length > 0
    )

    const isNumberedList =
      processableLines.length > 0 &&
      processableLines.every((line: string) => /^\s*\d+\.\s/.test(line))
    const isBulletList =
      !isNumberedList &&
      processableLines.length > 0 &&
      processableLines.every((line: string) => /^\s*[-*]\s/.test(line))

    let counter = 1
    const formatted = lines
      .map((line: string, i: number) => {
        if (i === lines.length - 1 && line === '') return line
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
      .join('\n')
    editor.replaceSelection(formatted)
  } else {
    editor.insertText('1. item')
  }
}
