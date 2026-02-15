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
export function parseTableRows(text: string): string[][] {
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

/**
 * Inserts a row into the markdown table.
 */
export function insertRow(
  text: string,
  referenceRowIndex: number,
  where: 'above' | 'below'
): string {
  if (!isMarkdownTable(text)) return text
  const rows = parseTableRows(text)
  const columnCount = rows[0].length
  const newRow = new Array(columnCount).fill('')

  // Adjust index based on 'where'
  // references are 0-indexed from the start of the table string rows
  // If 'below', we insert at index + 1
  // If 'above', we insert at index

  // Note: rows includes header and separator.
  // We generally don't want to insert above the header (index 0) or separator (index 1), logic should handle that caller side or just allow it.
  // Assuming strict structure: row 0 is header, row 1 is separator.

  let targetIndex = referenceRowIndex
  if (where === 'below') targetIndex++

  // Don't insert before header or separator if manageable, but pure function should just do it.

  rows.splice(targetIndex, 0, newRow)

  return formatTableFromRows(rows)
}

/**
 * Inserts a column into the markdown table.
 */
export function insertColumn(
  text: string,
  referenceColIndex: number,
  where: 'left' | 'right'
): string {
  if (!isMarkdownTable(text)) return text
  let rows = parseTableRows(text)

  let targetIndex = referenceColIndex
  if (where === 'right') targetIndex++

  rows = rows.map((row, rowIndex) => {
    // For separator row, we need to respect alignment if possible, otherwise default string
    if (rowIndex === 1 && row.every((c) => c.includes('-'))) {
      const newRow = [...row]
      newRow.splice(targetIndex, 0, '---')
      return newRow
    }
    const newRow = [...row]
    newRow.splice(targetIndex, 0, '')
    return newRow
  })

  return formatTableFromRows(rows)
}

/**
 * Deletes multiple rows from the markdown table.
 */
export function deleteRows(text: string, rowIndices: number[]): string {
  if (!isMarkdownTable(text)) return text
  const rows = parseTableRows(text)

  // Sort indices in descending order to avoid shifting issues
  const sortedIndices = [...rowIndices].sort((a, b) => b - a)

  for (const rowIndex of sortedIndices) {
    if (rowIndex >= 0 && rowIndex < rows.length) {
      rows.splice(rowIndex, 1)
    }
  }

  return formatTableFromRows(rows)
}

/**
 * Deletes multiple columns from the markdown table.
 */
export function deleteColumns(text: string, colIndices: number[]): string {
  if (!isMarkdownTable(text)) return text
  let rows = parseTableRows(text)

  if (rows.length === 0) return text

  // Sort indices in descending order
  const sortedIndices = [...colIndices].sort((a, b) => b - a)
  const maxCol = rows[0].length

  rows = rows.map((row) => {
    const newRow = [...row]
    for (const colIndex of sortedIndices) {
      if (colIndex >= 0 && colIndex < maxCol) {
        newRow.splice(colIndex, 1)
      }
    }
    return newRow
  })

  if (rows[0].length === 0) return ''

  return formatTableFromRows(rows)
}

/**
 * Deletes a row from the markdown table.
 */
export function deleteRow(text: string, rowIndex: number): string {
  return deleteRows(text, [rowIndex])
}

/**
 * Deletes a column from the markdown table.
 */
export function deleteColumn(text: string, colIndex: number): string {
  return deleteColumns(text, [colIndex])
}

function formatTableFromRows(rows: string[][]): string {
  // Reuse the logic from formatMarkdownTable but starting from rows
  if (rows.length === 0) return ''

  // 1. Identify separator row
  const separatorIndex = getSeparatorIndex(rows)
  // If we manipulated it such that separator is gone, we might just format as text or try to infer.
  // For now, assume structure is kept or we just format.

  // 3. Normalize columns
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

  // 4. Calculate max width per column
  const columnWidths = new Array(columnCount).fill(0)

  rows.forEach((row, rowIndex) => {
    if (rowIndex === separatorIndex) return

    for (let i = 0; i < columnCount; i++) {
      const cell = row[i] || ''
      columnWidths[i] = Math.max(columnWidths[i], getDisplayWidth(cell))
    }
  })

  // Ensure minimum width
  for (let i = 0; i < columnCount; i++) {
    columnWidths[i] = Math.max(columnWidths[i], 3)
  }

  // 5. Reconstruct
  const formattedLines = rows.map((row, rowIndex) => {
    if (rowIndex === separatorIndex) {
      return (
        '| ' +
        columnWidths
          .map((width, colIndex) => {
            const original = row[colIndex] || ''
            const firstChar = original.startsWith(':')
            const lastChar = original.endsWith(':')

            if (firstChar && lastChar) return ':' + '-'.repeat(width - 2) + ':'
            if (firstChar) return ':' + '-'.repeat(width - 1)
            if (lastChar) return '-'.repeat(width - 1) + ':'
            return '-'.repeat(width)
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
