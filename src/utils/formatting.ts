import type { EditorPaneHandle } from '@/components/EditorPane'

export function formatBold(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`**${selection}**`)
  } else {
    editor.insertText('**bold**')
  }
}

export function formatItalic(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`*${selection}*`)
  } else {
    editor.insertText('*italic*')
  }
}

export function formatLink(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`[${selection}](url)`)
  } else {
    editor.insertText('[link](url)')
  }
}

export function formatCode(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`\`${selection}\``)
  } else {
    editor.insertText('`code`')
  }
}

export function formatCodeBlock(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    editor.replaceSelection(`\`\`\`\n${selection}\n\`\`\``)
  } else {
    editor.insertText('```\ncode block\n```')
  }
}

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

export function formatBulletList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    const lines = selection.split('\n')
    const processableLines = lines.filter(
      (line, i) => !(i === lines.length - 1 && line === '') && line.trim().length > 0
    )

    const isBulletList =
      processableLines.length > 0 && processableLines.every((line) => /^\s*[-*]\s/.test(line))
    const isNumberedList =
      !isBulletList &&
      processableLines.length > 0 &&
      processableLines.every((line) => /^\s*\d+\.\s/.test(line))

    const formatted = lines
      .map((line, i) => {
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

export function formatNumberedList(editor: EditorPaneHandle | null): void {
  if (!editor) return

  const selection = editor.getSelection()
  if (selection) {
    const lines = selection.split('\n')
    const processableLines = lines.filter(
      (line, i) => !(i === lines.length - 1 && line === '') && line.trim().length > 0
    )

    const isNumberedList =
      processableLines.length > 0 && processableLines.every((line) => /^\s*\d+\.\s/.test(line))
    const isBulletList =
      !isNumberedList &&
      processableLines.length > 0 &&
      processableLines.every((line) => /^\s*[-*]\s/.test(line))

    let counter = 1
    const formatted = lines
      .map((line, i) => {
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
