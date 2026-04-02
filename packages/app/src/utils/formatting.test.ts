import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatBold,
  formatBulletList,
  formatCode,
  formatCodeBlock,
  formatHeading,
  formatItalic,
  formatLink,
  formatNumberedList,
  formatQuote,
  formatTaskList,
  getAutoContinueEdit,
  toggleTaskListItem,
} from './formatting'
import type { EditorPaneHandle } from '@/components/editor'

interface MockRange {
  startLineNumber: number
  endLineNumber: number
  startColumn: number
  endColumn: number
}

type InlineFormatter = (editor: EditorPaneHandle | null) => void

interface InlineFormattingCase {
  name: string
  formatter: InlineFormatter
  selectedResult: string
  insertedTemplate: string
}

describe('formatting utils', () => {
  let mockEditor: EditorPaneHandle
  let getSelectionMock: ReturnType<typeof vi.fn>
  let replaceSelectionMock: ReturnType<typeof vi.fn>
  let insertTextMock: ReturnType<typeof vi.fn>
  let getSelectionRangeMock: ReturnType<typeof vi.fn>
  let getLineContentMock: ReturnType<typeof vi.fn>
  let setSelectionMock: ReturnType<typeof vi.fn>

  const setRange = (range: MockRange): void => {
    getSelectionRangeMock.mockReturnValue(range)
  }

  const setLineMap = (lines: string[]): void => {
    getLineContentMock.mockImplementation((lineNumber: number) => lines[lineNumber - 1] ?? '')
  }

  const setSingleLine = (line: string): void => {
    setRange({
      startLineNumber: 1,
      endLineNumber: 1,
      startColumn: 1,
      endColumn: 1,
    })
    getLineContentMock.mockReturnValue(line)
  }

  const setMultilineInput = (input: string): void => {
    const lines = input.split('\n')
    setRange({
      startLineNumber: 1,
      endLineNumber: lines.length,
      startColumn: 1,
      endColumn: 1,
    })
    setLineMap(lines)
  }

  beforeEach(() => {
    getSelectionMock = vi.fn()
    replaceSelectionMock = vi.fn()
    insertTextMock = vi.fn()
    getSelectionRangeMock = vi.fn()
    getLineContentMock = vi.fn()
    setSelectionMock = vi.fn()

    mockEditor = {
      getSelection: getSelectionMock,
      replaceSelection: replaceSelectionMock,
      insertText: insertTextMock,
      getSelectionRange: getSelectionRangeMock,
      getLineContent: getLineContentMock,
      setSelection: setSelectionMock,
    } as unknown as EditorPaneHandle
  })

  describe('inline formatters', () => {
    const cases: InlineFormattingCase[] = [
      {
        name: 'formatBold',
        formatter: formatBold,
        selectedResult: '**text**',
        insertedTemplate: '****',
      },
      {
        name: 'formatItalic',
        formatter: formatItalic,
        selectedResult: '*text*',
        insertedTemplate: '**',
      },
      {
        name: 'formatLink',
        formatter: formatLink,
        selectedResult: '[text](url)',
        insertedTemplate: '[](url)',
      },
      {
        name: 'formatCode',
        formatter: formatCode,
        selectedResult: '`text`',
        insertedTemplate: '``',
      },
    ]

    it.each(cases)('wraps selected text for $name', ({ formatter, selectedResult }) => {
      getSelectionMock.mockReturnValue('text')
      formatter(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith(selectedResult)
    })

    it.each(cases)(
      'inserts template when selection is empty for $name',
      ({ formatter, insertedTemplate }) => {
        getSelectionMock.mockReturnValue('')
        formatter(mockEditor)
        expect(insertTextMock).toHaveBeenCalledWith(insertedTemplate)
      }
    )
  })

  describe('formatCodeBlock', () => {
    it('wraps selected line with code fence', () => {
      setRange({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 5,
      })
      getLineContentMock.mockReturnValue('text')

      formatCodeBlock(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('```\ntext\n```')
      expect(setSelectionMock).toHaveBeenCalledWith({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 5,
      })
    })

    it('inserts empty code block on empty line', () => {
      setSingleLine('')

      formatCodeBlock(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('```\n\n```')
    })
  })

  describe('formatHeading', () => {
    it('inserts heading placeholder on empty line', () => {
      setSingleLine('')

      formatHeading(mockEditor, 1)

      expect(insertTextMock).toHaveBeenCalledWith('# ')
      expect(replaceSelectionMock).not.toHaveBeenCalled()
    })

    it('applies heading to non-empty current line', () => {
      setRange({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 5,
        endColumn: 5,
      })
      getLineContentMock.mockReturnValue('My Title')

      formatHeading(mockEditor, 1)

      expect(setSelectionMock).toHaveBeenCalledWith({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 9,
      })
      expect(replaceSelectionMock).toHaveBeenCalledWith('# My Title')
    })

    it('applies heading to all selected lines', () => {
      setMultilineInput('Title 1\nTitle 2')

      formatHeading(mockEditor, 1)

      expect(replaceSelectionMock).toHaveBeenCalledWith('# Title 1\n# Title 2')
    })

    it('replaces existing heading level', () => {
      setSingleLine('## Title')

      formatHeading(mockEditor, 1)

      expect(replaceSelectionMock).toHaveBeenCalledWith('# Title')
    })
  })

  describe('formatQuote', () => {
    it('prefixes each selected line with quote marker', () => {
      setMultilineInput('line 1\nline 2')

      formatQuote(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('> line 1\n> line 2')
    })

    it('quotes blank lines between content lines', () => {
      setMultilineInput('line 1\n\nline 2')

      formatQuote(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('> line 1\n> \n> line 2')
    })

    it('inserts quote marker on empty line', () => {
      setSingleLine('')

      formatQuote(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('> ')
    })
  })

  describe('list formatters', () => {
    it.each([
      {
        name: 'formatBulletList prefixes plain lines',
        formatter: formatBulletList,
        input: 'item 1\nitem 2',
        expected: '- item 1\n- item 2',
      },
      {
        name: 'formatBulletList toggles existing bullet list',
        formatter: formatBulletList,
        input: '- item 1\n- item 2',
        expected: 'item 1\nitem 2',
      },
      {
        name: 'formatBulletList converts numbered list',
        formatter: formatBulletList,
        input: '1. item 1\n2. item 2',
        expected: '- item 1\n- item 2',
      },
      {
        name: 'formatBulletList converts task list',
        formatter: formatBulletList,
        input: '- [ ] item 1\n- [x] item 2',
        expected: '- item 1\n- item 2',
      },
      {
        name: 'formatNumberedList prefixes plain lines',
        formatter: formatNumberedList,
        input: 'item 1\nitem 2',
        expected: '1. item 1\n2. item 2',
      },
      {
        name: 'formatNumberedList toggles numbered list',
        formatter: formatNumberedList,
        input: '1. item 1\n2. item 2',
        expected: 'item 1\nitem 2',
      },
      {
        name: 'formatNumberedList converts bullet list',
        formatter: formatNumberedList,
        input: '- item 1\n- item 2',
        expected: '1. item 1\n2. item 2',
      },
      {
        name: 'formatNumberedList converts task list',
        formatter: formatNumberedList,
        input: '- [ ] item 1\n- [x] item 2',
        expected: '1. item 1\n2. item 2',
      },
      {
        name: 'formatTaskList prefixes plain lines',
        formatter: formatTaskList,
        input: 'item 1\nitem 2',
        expected: '- [ ] item 1\n- [ ] item 2',
      },
      {
        name: 'formatTaskList converts bullet list',
        formatter: formatTaskList,
        input: '- item 1\n* item 2',
        expected: '- [ ] item 1\n- [ ] item 2',
      },
      {
        name: 'formatTaskList converts numbered list',
        formatter: formatTaskList,
        input: '1. item 1\n2. item 2',
        expected: '- [ ] item 1\n- [ ] item 2',
      },
      {
        name: 'formatTaskList toggles task markers',
        formatter: formatTaskList,
        input: '- [ ] item 1\n- [x] item 2',
        expected: 'item 1\nitem 2',
      },
    ])('$name', ({ formatter, input, expected }) => {
      setMultilineInput(input)

      formatter(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith(expected)
    })

    it.each([
      {
        name: 'formatBulletList inserts placeholder on empty line',
        formatter: formatBulletList,
        expectedPlaceholder: '- ',
      },
      {
        name: 'formatNumberedList inserts placeholder on empty line',
        formatter: formatNumberedList,
        expectedPlaceholder: '1. ',
      },
      {
        name: 'formatTaskList inserts placeholder on empty line',
        formatter: formatTaskList,
        expectedPlaceholder: '- [ ] ',
      },
    ])('$name', ({ formatter, expectedPlaceholder }) => {
      setSingleLine('')

      formatter(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith(expectedPlaceholder)
    })
  })

  it('does nothing when editor is null', () => {
    formatBold(null)
    formatItalic(null)
    formatLink(null)
    formatCode(null)
    formatCodeBlock(null)
    formatHeading(null, 1)
    formatQuote(null)
    formatBulletList(null)
    formatNumberedList(null)
    formatTaskList(null)
  })
})

describe('toggleTaskListItem', () => {
  it.each([
    {
      name: 'checks the targeted task',
      input: '- [ ] first\n- [x] second',
      index: 0,
      checked: true,
      expected: '- [x] first\n- [x] second',
    },
    {
      name: 'unchecks the targeted task',
      input: '- [x] first\n- [x] second',
      index: 1,
      checked: false,
      expected: '- [x] first\n- [ ] second',
    },
    {
      name: 'leaves markdown unchanged when index is missing',
      input: '- [ ] first',
      index: 3,
      checked: true,
      expected: '- [ ] first',
    },
  ])('$name', ({ input, index, checked, expected }) => {
    expect(toggleTaskListItem(input, index, checked)).toBe(expected)
  })
})

describe('getAutoContinueEdit', () => {
  it('returns null when no pattern matches', () => {
    expect(getAutoContinueEdit('Just some text', 15)).toBeNull()
  })

  it.each([
    { name: 'empty unordered list', line: '- ', column: 3 },
    { name: 'empty ordered list', line: '1. ', column: 4 },
    { name: 'empty quote', line: '> ', column: 3 },
    { name: 'empty task list', line: '- [ ] ', column: 7 },
  ])('returns exit action for $name', ({ line, column }) => {
    expect(getAutoContinueEdit(line, column)).toEqual({
      action: 'exit',
      range: {
        startColumn: 1,
        endColumn: column,
      },
    })
  })

  it.each([
    { name: 'unordered list', line: '- Item 1', column: 9, text: '\n- ' },
    { name: 'unchecked task list', line: '- [ ] todo', column: 11, text: '\n- [ ] ' },
    { name: 'checked task list', line: '- [x] done', column: 11, text: '\n- [x] ' },
    { name: 'unordered list with asterisk', line: '* Item 1', column: 9, text: '\n* ' },
    { name: 'ordered list increments number', line: '1. Item 1', column: 10, text: '\n2. ' },
    { name: 'quote line', line: '> Quote me', column: 11, text: '\n> ' },
  ])('returns continue action for $name', ({ line, column, text }) => {
    expect(getAutoContinueEdit(line, column)).toEqual({
      action: 'continue',
      text,
      range: {
        startColumn: column,
        endColumn: column,
      },
    })
  })

  it('returns null when cursor is before list prefix content', () => {
    expect(getAutoContinueEdit('- Item 1', 2)).toBeNull()
  })
})
