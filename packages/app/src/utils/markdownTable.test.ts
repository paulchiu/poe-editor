import { describe, it, expect } from 'vitest'
import {
  isMarkdownTable,
  formatMarkdownTable,
  formatAllTables,
  insertRow,
  insertColumn,
  deleteRow,
  deleteColumn,
} from './markdownTable'

const simpleTable = `
| h1 | h2 |
| -- | -- |
| c1 | c2 |
`.trim()

describe('markdownTable', () => {
  it('detects valid tables', () => {
    expect(isMarkdownTable(simpleTable)).toBe(true)
    expect(isMarkdownTable('not a table')).toBe(false)
  })

  it('formats tables', () => {
    const unformatted = `|h1|h2|
|---|---|
|c1|c2|`
    const formatted = formatMarkdownTable(unformatted)
    expect(formatted).toContain('| h1  | h2  |')
    expect(formatted).toContain('| --- | --- |')
    expect(formatted).toContain('| c1  | c2  |')
  })

  describe('formatAllTables', () => {
    it('formats multiple tables in a document', () => {
      const doc = [
        '# Title',
        '',
        '|h1|h2|',
        '|---|---|',
        '|c1|c2|',
        '',
        'Some text',
        '',
        '|a|b|c|',
        '|---|---|---|',
        '|d|e|f|',
      ].join('\n')

      const result = formatAllTables(doc)
      expect(result).toContain('| h1  | h2  |')
      expect(result).toContain('| a   | b   | c   |')
      expect(result).toContain('# Title')
      expect(result).toContain('Some text')
    })

    it('returns text unchanged when there are no tables', () => {
      const doc = '# Hello\n\nJust some text.'
      expect(formatAllTables(doc)).toBe(doc)
    })

    it('handles a single table', () => {
      const doc = '|h1|h2|\n|---|---|\n|c1|c2|'
      const result = formatAllTables(doc)
      expect(result).toContain('| h1  | h2  |')
    })

    it('preserves lines containing pipe that are not valid tables', () => {
      const doc = 'a | b is not a table'
      expect(formatAllTables(doc)).toBe(doc)
    })

    it('does not alter already-formatted tables', () => {
      const formatted = '| h1  | h2  |\n| --- | --- |\n| c1  | c2  |'
      const doc = `# Doc\n\n${formatted}\n\nEnd`
      expect(formatAllTables(doc)).toBe(doc)
    })
  })

  describe('table manipulation', () => {
    it('inserts row below', () => {
      const result = insertRow(simpleTable, 2, 'below')
      const lines = result.split('\n')
      expect(lines.length).toBe(4) // Header + Separator + Original Row + New Row
      expect(lines[3]).toContain('|     |     |')
    })

    it('inserts row above', () => {
      const result = insertRow(simpleTable, 2, 'above')
      const lines = result.split('\n')
      expect(lines.length).toBe(4)
      expect(lines[2]).toContain('|     |     |')
      expect(lines[3]).toContain('c1')
    })

    it('inserts column right', () => {
      const result = insertColumn(simpleTable, 1, 'right')
      const lines = result.split('\n')
      expect(lines[0].split('|').length).toBe(5) // Empty start + 3 cols + Empty end
      // | h1  | h2  |     |
      expect(lines[0]).toContain('| h2  |     |')
    })

    it('inserts column left', () => {
      const result = insertColumn(simpleTable, 1, 'left')
      const lines = result.split('\n')
      expect(lines[0].split('|').length).toBe(5)
      // | h1  |     | h2  |
      expect(lines[0]).toContain('| h1  |     | h2  |')
    })

    it('deletes row', () => {
      const result = deleteRow(simpleTable, 2)
      const lines = result.split('\n')
      expect(lines.length).toBe(2) // Header + Separator
      expect(result).not.toContain('c1')
    })

    it('deletes column', () => {
      const result = deleteColumn(simpleTable, 0)
      const lines = result.split('\n')
      expect(lines.length).toBe(3)
      expect(lines[0]).not.toContain('h1')
      expect(lines[0]).toContain('h2')
    })
  })
})
