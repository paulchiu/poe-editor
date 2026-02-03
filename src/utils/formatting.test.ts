import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatBold,
  formatItalic,
  formatLink,
  formatCode,
  formatCodeBlock,
  formatHeading,
  formatQuote,
  formatBulletList,
  formatNumberedList,
} from './formatting'
import type { EditorPaneHandle } from '@/components/EditorPane'

describe('formatting utils', () => {
  let mockEditor: EditorPaneHandle
  let getSelectionMock: ReturnType<typeof vi.fn>
  let replaceSelectionMock: ReturnType<typeof vi.fn>
  let insertTextMock: ReturnType<typeof vi.fn>
  let getSelectionRangeMock: ReturnType<typeof vi.fn>
  let getLineContentMock: ReturnType<typeof vi.fn>
  let setSelectionMock: ReturnType<typeof vi.fn>

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

  describe('formatBold', () => {
    it('should wrap selection with **', () => {
      getSelectionMock.mockReturnValue('text')
      formatBold(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('**text**')
    })

    it('should insert **bold** if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatBold(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('**bold**')
    })
  })

  describe('formatItalic', () => {
    it('should wrap selection with *', () => {
      getSelectionMock.mockReturnValue('text')
      formatItalic(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('*text*')
    })

    it('should insert *italic* if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatItalic(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('*italic*')
    })
  })

  describe('formatLink', () => {
    it('should wrap selection with link syntax', () => {
      getSelectionMock.mockReturnValue('text')
      formatLink(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('[text](url)')
    })

    it('should insert link syntax if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatLink(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('[link](url)')
    })
  })

  describe('formatCode', () => {
    it('should wrap selection with backticks', () => {
      getSelectionMock.mockReturnValue('text')
      formatCode(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('`text`')
    })

    it('should insert code if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatCode(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('`code`')
    })
  })

  describe('formatCodeBlock', () => {
    it('should wrap selection with triple backticks', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 5,
      })
      getLineContentMock.mockReturnValue('text')

      formatCodeBlock(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('```\ntext\n```')
      expect(setSelectionMock).toHaveBeenCalled()
    })

    it('should insert code block if no selection', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('')

      formatCodeBlock(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('```\ncode block\n```')
    })
  })

  describe('formatHeading', () => {
    it('should insert heading placeholder if on empty line', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('')

      formatHeading(mockEditor, 1)
      expect(insertTextMock).toHaveBeenCalledWith('# heading')
      expect(replaceSelectionMock).not.toHaveBeenCalled()
    })

    it('should apply heading to current line if has text (no selection)', () => {
      getSelectionRangeMock.mockReturnValue({
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
        endColumn: 9, // length + 1
      })
      expect(replaceSelectionMock).toHaveBeenCalledWith('# My Title')
    })

    it('should apply heading to all spanned lines if multiple lines selected', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 5,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return 'Title 1'
        if (line === 2) return 'Title 2'
        return ''
      })

      formatHeading(mockEditor, 1)

      expect(setSelectionMock).toHaveBeenCalledWith({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 8, // length of last line (7) + 1
      })
      expect(replaceSelectionMock).toHaveBeenCalledWith('# Title 1\n# Title 2')
    })

    it('should replace existing heading level', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('## Title')

      formatHeading(mockEditor, 1)

      expect(replaceSelectionMock).toHaveBeenCalledWith('# Title')
    })
  })

  describe('formatQuote', () => {
    it('should prefix lines with >', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 7,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return 'line 1'
        if (line === 2) return 'line 2'
        return ''
      })

      formatQuote(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('> line 1\n> line 2')
    })

    it('should insert quote placeholder if no selection', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('')

      formatQuote(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('> quote')
    })
  })

  describe('formatBulletList', () => {
    it('should prefix lines with - ', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 7,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return 'item 1'
        if (line === 2) return 'item 2'
        return ''
      })

      formatBulletList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('- item 1\n- item 2')
    })

    it('should toggle off bullet list', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 9,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return '- item 1'
        if (line === 2) return '- item 2'
        return ''
      })

      formatBulletList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('item 1\nitem 2')
    })

    it('should convert numbered list to bullet list', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 10,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return '1. item 1'
        if (line === 2) return '2. item 2'
        return ''
      })

      formatBulletList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('- item 1\n- item 2')
    })

    it('should insert bullet list item if no selection', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('')

      formatBulletList(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('- item')
    })
  })

  describe('formatNumberedList', () => {
    it('should prefix lines with numbers', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 7,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return 'item 1'
        if (line === 2) return 'item 2'
        return ''
      })

      formatNumberedList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('1. item 1\n2. item 2')
    })

    it('should toggle off numbered list', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 10,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return '1. item 1'
        if (line === 2) return '2. item 2'
        return ''
      })

      formatNumberedList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('item 1\nitem 2')
    })

    it('should convert bullet list to numbered list', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 2,
        startColumn: 1,
        endColumn: 9,
      })
      getLineContentMock.mockImplementation((line) => {
        if (line === 1) return '- item 1'
        if (line === 2) return '- item 2'
        return ''
      })

      formatNumberedList(mockEditor)

      expect(replaceSelectionMock).toHaveBeenCalledWith('1. item 1\n2. item 2')
    })

    it('should insert numbered list item if no selection', () => {
      getSelectionRangeMock.mockReturnValue({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 1,
        endColumn: 1,
      })
      getLineContentMock.mockReturnValue('')

      formatNumberedList(mockEditor)

      expect(insertTextMock).toHaveBeenCalledWith('1. item')
    })
  })

  it('should do nothing if editor is null', () => {
    formatBold(null)
    // Expect no errors
  })
})
