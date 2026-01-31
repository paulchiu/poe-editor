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

  beforeEach(() => {
    getSelectionMock = vi.fn()
    replaceSelectionMock = vi.fn()
    insertTextMock = vi.fn()

    mockEditor = {
      getSelection: getSelectionMock,
      replaceSelection: replaceSelectionMock,
      insertText: insertTextMock,
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
      getSelectionMock.mockReturnValue('text')
      formatCodeBlock(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('```\ntext\n```')
    })

    it('should insert code block if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatCodeBlock(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('```\ncode block\n```')
    })
  })

  describe('formatHeading', () => {
    it('should prefix selection with # based on level', () => {
      getSelectionMock.mockReturnValue('Heading')
      formatHeading(mockEditor, 2)
      expect(replaceSelectionMock).toHaveBeenCalledWith('## Heading')
    })

    it('should insert heading if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatHeading(mockEditor, 1)
      expect(insertTextMock).toHaveBeenCalledWith('# heading')
    })
  })

  describe('formatQuote', () => {
    it('should prefix lines with >', () => {
      getSelectionMock.mockReturnValue('line 1\nline 2')
      formatQuote(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('> line 1\n> line 2')
    })

    it('should insert quote placeholder if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatQuote(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('> quote')
    })
  })

  describe('formatBulletList', () => {
    it('should prefix lines with - ', () => {
      getSelectionMock.mockReturnValue('item 1\nitem 2')
      formatBulletList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('- item 1\n- item 2')
    })

    it('should toggle off bullet list', () => {
      getSelectionMock.mockReturnValue('- item 1\n- item 2')
      formatBulletList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('item 1\nitem 2')
    })

    it('should convert numbered list to bullet list', () => {
      getSelectionMock.mockReturnValue('1. item 1\n2. item 2')
      formatBulletList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('- item 1\n- item 2')
    })

    it('should insert bullet list item if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatBulletList(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('- item')
    })
  })

  describe('formatNumberedList', () => {
    it('should prefix lines with numbers', () => {
      getSelectionMock.mockReturnValue('item 1\nitem 2')
      formatNumberedList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('1. item 1\n2. item 2')
    })

    it('should toggle off numbered list', () => {
      getSelectionMock.mockReturnValue('1. item 1\n2. item 2')
      formatNumberedList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('item 1\nitem 2')
    })

    it('should convert bullet list to numbered list', () => {
      getSelectionMock.mockReturnValue('- item 1\n- item 2')
      formatNumberedList(mockEditor)
      expect(replaceSelectionMock).toHaveBeenCalledWith('1. item 1\n2. item 2')
    })

    it('should insert numbered list item if no selection', () => {
      getSelectionMock.mockReturnValue('')
      formatNumberedList(mockEditor)
      expect(insertTextMock).toHaveBeenCalledWith('1. item')
    })
  })

  it('should do nothing if editor is null', () => {
    formatBold(null)
    // Expect no errors
  })
})
