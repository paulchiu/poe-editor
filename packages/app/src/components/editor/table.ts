import type { editor } from 'monaco-editor'
import { isMarkdownTable, parseTableRows } from '@/utils/markdownTable'

// Helper to check if a line is part of a table
export const isTableLine = (lineContent: string) => lineContent.includes('|')

export interface TableScope {
  range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
  text: string
  rowIndex: number
  colIndex: number
  rows: string[][]
  startLine: number
}

/**
 * Identifies the markdown table at the current cursor position.
 * @param model - The Monaco editor text model
 * @param position - The current cursor position
 * @returns TableScope object if inside a table, null otherwise
 */
export function getTableAtCursor(
  model: editor.ITextModel,
  position: { lineNumber: number; column: number }
): TableScope | null {
  const currentLine = position.lineNumber
  if (!isTableLine(model.getLineContent(currentLine))) return null

  let startLine = currentLine
  while (startLine > 1 && isTableLine(model.getLineContent(startLine - 1))) {
    startLine--
  }

  let endLine = currentLine
  while (endLine < model.getLineCount() && isTableLine(model.getLineContent(endLine + 1))) {
    endLine++
  }

  const range = {
    startLineNumber: startLine,
    startColumn: 1,
    endLineNumber: endLine,
    endColumn: model.getLineMaxColumn(endLine),
  }

  const tableText = model.getValueInRange(range)
  if (!isMarkdownTable(tableText)) return null

  const rows = parseTableRows(tableText)
  const columnCount = rows[0]?.length || 0

  // Row index relative to table start
  const rowIndex = currentLine - startLine

  // Calculate column index based on pipes before cursor
  const lineContent = model.getLineContent(currentLine)
  // Ensure we don't look past the cursor
  const contentBeforeCursor = lineContent.substring(0, position.column - 1)

  const pipesBefore = (contentBeforeCursor.match(/\|/g) || []).length
  // If line starts with pipe, col index is pipesBefore - 1.
  let colIndex = pipesBefore - 1
  if (!lineContent.trim().startsWith('|')) colIndex = pipesBefore

  // Clamp colIndex to valid range [0, columnCount - 1]
  if (colIndex < 0) colIndex = 0
  if (colIndex >= columnCount) colIndex = Math.max(0, columnCount - 1)

  return {
    range,
    text: tableText,
    rowIndex,
    colIndex,
    rows,
    startLine,
  }
}

/**
 * Handles Tab navigation within a markdown table.
 * @param editor - The Monaco editor instance
 * @param direction - 1 for next cell, -1 for previous cell
 */
export function handleTableNavigation(editor: editor.IStandaloneCodeEditor, direction: 1 | -1) {
  const position = editor.getPosition()
  if (!position) return

  const model = editor.getModel()
  if (!model) return

  const tableData = getTableAtCursor(model, position)
  if (!tableData) return

  const { rows, rowIndex, colIndex, startLine } = tableData

  const rowCount = rows.length
  const colCount = rows[0]?.length || 0

  if (rowCount === 0 || colCount === 0) return

  let nextRow = rowIndex
  let nextCol = colIndex + direction

  // Navigate
  // If moving forward
  if (direction === 1) {
    if (nextCol >= colCount) {
      nextCol = 0
      nextRow++
    }
    // Skip separator (index 1 usually)
    if (nextRow === 1) {
      nextRow++
    }
    // Wrap to start
    if (nextRow >= rowCount) {
      nextRow = 0
      nextCol = 0
    }
  }
  // If moving backward
  else {
    if (nextCol < 0) {
      nextCol = colCount - 1
      nextRow--
    }
    if (nextRow === 1) {
      nextRow--
    }
    // Wrap to end
    if (nextRow < 0) {
      nextRow = rowCount - 1
      nextCol = colCount - 1
    }
  }

  // Calculate new position
  const targetLineIndex = startLine + nextRow
  const targetLineContent = model.getLineContent(targetLineIndex)

  // Find pipe indices to locate the cell
  const pipeIndices: number[] = []
  for (let i = 0; i < targetLineContent.length; i++) {
    if (targetLineContent[i] === '|') pipeIndices.push(i)
  }

  // Safety check
  if (nextCol < pipeIndices.length - 1) {
    const startColPos = pipeIndices[nextCol] + 1 // +1 to skip pipe
    const endColPos = pipeIndices[nextCol + 1]

    const cellContent = targetLineContent.substring(startColPos, endColPos)
    const firstNonSpace = cellContent.search(/\S/)

    const newColumn = startColPos + (firstNonSpace !== -1 ? firstNonSpace : 1)

    editor.setPosition({
      lineNumber: targetLineIndex,
      column: newColumn + 1, // Monaco is 1-indexed
    })
    editor.revealPosition({
      lineNumber: targetLineIndex,
      column: newColumn + 1,
    })
  }
}

export interface TableSelection {
  tableScope: TableScope
  selectedRowIndices: number[]
  selectedColIndices: number[]
}

/**
 * Gets the table scope and selected rows/columns based on the current selection.
 */
export function getTableSelection(
  model: editor.ITextModel,
  selection: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
): TableSelection | null {
  // Check if the selection start is inside a table
  const startPos = { lineNumber: selection.startLineNumber, column: selection.startColumn }
  const tableScope = getTableAtCursor(model, startPos)

  if (!tableScope) return null

  // Check if the selection end is also inside the SAME table
  // Optimization: check if endLineNumber is within table range
  if (selection.endLineNumber > tableScope.range.endLineNumber) {
    // Selection extends beyond table, treat as non-table selection?
    // Or just clamp? Let's treat as valid if start is in table.
    // But for table operations, usually we want to contain it.
    // Let's proceed with the scope found at start.
  }

  const { startLine, rows } = tableScope

  // Calculate row indices
  const selectedRowIndices: number[] = []
  for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
    const rowIndex = i - startLine
    if (rowIndex >= 0 && rowIndex < rows.length) {
      // Exclude separator row (index 1) from deletion context usually?
      // But if user selects it, we might include it.
      selectedRowIndices.push(rowIndex)
    }
  }

  // Calculate column indices
  // This is trickier because of variable cell widths.
  // We need to map selection start/end columns to table columns.
  // If usage is "highlight text across columns", we interpret that as selecting those columns.

  // Simple heuristic:
  // 1. Identify start col index from selection.startColumn
  // 2. Identify end col index from selection.endColumn

  const startLineContent = model.getLineContent(selection.startLineNumber)
  const endLineContent = model.getLineContent(selection.endLineNumber)

  const getColIndex = (line: string, col: number) => {
    const prefix = line.substring(0, col - 1)
    const pipes = (prefix.match(/\|/g) || []).length
    return Math.max(0, pipes - 1)
  }

  const startColIdx = getColIndex(startLineContent, selection.startColumn)
  const endColIdx = getColIndex(endLineContent, selection.endColumn)

  const selectedColIndices: number[] = []
  const minCol = Math.min(startColIdx, endColIdx)
  const maxCol = Math.max(startColIdx, endColIdx)

  for (let i = minCol; i <= maxCol; i++) {
    if (i < rows[0].length) {
      selectedColIndices.push(i)
    }
  }

  return {
    tableScope,
    selectedRowIndices,
    selectedColIndices,
  }
}
