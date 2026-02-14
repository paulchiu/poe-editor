/**
 * Calculates the display width of a string, accounting for wide characters (CJK, emojis, etc.)
 * This is a simplified implementation.
 */
function getDisplayWidth(str: string): number {
  let width = 0
  for (const char of str) {
    // ASCII characters
    if (char.codePointAt(0)! <= 127) {
      width += 1
    } else {
      // Crude check for wide characters:
      // - CJK Unified Ideographs: 4E00-9FFF
      // - Fullwidth forms: FF00-FFEF
      // - CJK punctuation, Hiragana, Katakana, etc.
      // Emojis are often wide (2) but some are valid as 1. 2 is safer for alignment.
      width += 2
    }
  }
  return width
}

/**
 * Pads a string to a specific width, accounting for wide characters.
 */
function padToWidth(str: string, width: number, paddingChar = ' '): string {
  const currentWidth = getDisplayWidth(str)
  if (currentWidth >= width) return str
  return str + paddingChar.repeat(width - currentWidth)
}

/**
 * Formats a markdown table to have aligned columns.
 * @param text The markdown table text.
 * @returns The formatted markdown table.
 */
function parseTableRows(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map((line) => {
    const cells = line.split('|').map((c) => c.trim())

    // Remove empty leading/trailing cells if the row starts/ends with a pipe.
    if (line.trim().startsWith('|') && cells[0] === '') cells.shift()
    if (line.trim().endsWith('|') && cells[cells.length - 1] === '') cells.pop()

    return cells
  })
}

function getSeparatorIndex(rows: string[][]): number {
  return rows.findIndex((row) => row.every((cell) => /^[:\-\s]+$/.test(cell) && cell.includes('-')))
}

/**
 * Checks whether the provided text contains a valid markdown table structure.
 * @param text The text to validate.
 * @returns True if the text has at least one markdown table separator row.
 */
export function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return false

  const rows = parseTableRows(text)
  return getSeparatorIndex(rows) !== -1
}

/**
 * Formats a markdown table to have aligned columns.
 * @param text The markdown table text.
 * @returns The formatted markdown table.
 */
export function formatMarkdownTable(text: string): string {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return text // Not a valid table

  const rows = parseTableRows(text)

  // 2. Identify separator row (usually 2nd row, contains ---)
  const separatorIndex = getSeparatorIndex(rows)

  if (separatorIndex === -1) return text // No separator found, not a table

  // 3. Normalize columns
  // Calculate max columns
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

  // 4. Calculate max width per column
  const columnWidths = new Array(columnCount).fill(0)

  rows.forEach((row, rowIndex) => {
    // Skip separator row for width calculation (we regenerate it)
    if (rowIndex === separatorIndex) return

    for (let i = 0; i < columnCount; i++) {
      const cell = row[i] || ''
      columnWidths[i] = Math.max(columnWidths[i], getDisplayWidth(cell))
    }
  })

  // Ensure minimum width of 3 for separator (e.g. `---`)
  for (let i = 0; i < columnCount; i++) {
    columnWidths[i] = Math.max(columnWidths[i], 3)
  }

  // 5. Reconstruct table
  const formattedLines = rows.map((row, rowIndex) => {
    if (rowIndex === separatorIndex) {
      // Reconstruct separator row based on alignment of original if present, or default to ---
      return (
        '| ' +
        columnWidths
          .map((width, colIndex) => {
            const original = row[colIndex] || ''
            // Detect alignment
            const firstChar = original.startsWith(':')
            const lastChar = original.endsWith(':')

            let content = '-'.repeat(width)
            if (firstChar && lastChar) {
              content = ':' + '-'.repeat(width - 2) + ':'
            } else if (firstChar) {
              content = ':' + '-'.repeat(width - 1)
            } else if (lastChar) {
              content = '-'.repeat(width - 1) + ':'
            }
            return content
          })
          .join(' | ') +
        ' |'
      )
    } else {
      return (
        '| ' +
        columnWidths
          .map((width, colIndex) => {
            const cell = row[colIndex] || ''
            return padToWidth(cell, width)
          })
          .join(' | ') +
        ' |'
      )
    }
  })

  return formattedLines.join('\n')
}
