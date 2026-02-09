import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard, stripHtml } from './clipboard'

describe('clipboard utils', () => {
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      const html = '<h1>Hello</h1><p>World</p>'
      expect(stripHtml(html)).toBe('HelloWorld')
    })

    it('returns empty string for empty input', () => {
      expect(stripHtml('')).toBe('')
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        clipboard: {
          write: vi.fn().mockResolvedValue(undefined),
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })
      // Mock Blob and ClipboardItem if they don't exist in the environment
      if (typeof Blob === 'undefined') {
        vi.stubGlobal('Blob', vi.fn())
      }
      if (typeof ClipboardItem === 'undefined') {
        vi.stubGlobal('ClipboardItem', vi.fn())
      }
    })

    it('uses writeText for plain text only', async () => {
      // Temporarily remove ClipboardItem to trigger weightText branch
      const originalClipboardItem = global.ClipboardItem
      // @ts-expect-error - testing fallback
      delete global.ClipboardItem

      await copyToClipboard('plain text')
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('plain text')

      global.ClipboardItem = originalClipboardItem
    })

    it('uses write for text and html when available', async () => {
      await copyToClipboard('plain text', '<h1>html</h1>')
      expect(navigator.clipboard.write).toHaveBeenCalled()
    })
  })
})
