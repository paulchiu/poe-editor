import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard, copySvgImageToClipboard, stripHtml } from './clipboard'
import { extractFrontMatter, renderFrontMatterHtml } from './frontMatter'

describe('clipboard utils', () => {
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      const html = '<h1>Hello</h1><p>World</p>'
      expect(stripHtml(html)).toBe('HelloWorld')
    })

    it('returns empty string for empty input', () => {
      expect(stripHtml('')).toBe('')
    })

    it('keeps front matter properties readable in plain text', () => {
      const html =
        '<section class="front-matter-properties"><table><tbody><tr><th>title</th><td>Poe test</td></tr><tr><th>tags</th><td><span class="front-matter-chip">markdown</span><span class="front-matter-chip">preview</span></td></tr></tbody></table></section><h1>Body</h1>'

      expect(stripHtml(html)).toBe('title: Poe test\ntags: markdown, preview\nBody')
    })

    it('keeps nested front matter properties readable without duplicate rows', () => {
      const result = extractFrontMatter(
        [
          '---',
          'review:',
          '  codex_status: reviewed',
          '  approved: true',
          'tags:',
          '  - markdown',
          '  - preview',
          '---',
          '# Body',
        ].join('\n')
      )
      const html = `${renderFrontMatterHtml(result!.frontMatter)}<h1>Body</h1>`

      expect(stripHtml(html)).toBe(
        [
          'review:',
          '  codex_status: reviewed',
          '  approved: true',
          'tags: markdown, preview',
          'Body',
        ].join('\n')
      )
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

  describe('copySvgImageToClipboard', () => {
    beforeEach(() => {
      const clipboardItemMock = vi.fn(function ClipboardItemMock(
        this: { data: unknown },
        data: unknown
      ) {
        this.data = data
      })
      vi.stubGlobal('navigator', {
        clipboard: {
          write: vi.fn().mockResolvedValue(undefined),
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })
      if (typeof Blob === 'undefined') {
        vi.stubGlobal('Blob', vi.fn())
      }
      vi.stubGlobal('ClipboardItem', clipboardItemMock)
    })

    it('writes svg image data to clipboard when supported', async () => {
      await copySvgImageToClipboard('<svg><rect width="10" height="10"/></svg>')
      expect(navigator.clipboard.write).toHaveBeenCalled()
    })

    it('writes image-only clipboard formats for svg copy', async () => {
      await copySvgImageToClipboard('<svg><rect width="10" height="10"/></svg>')

      const ClipboardItemMock = global.ClipboardItem as unknown as ReturnType<typeof vi.fn>
      expect(ClipboardItemMock).toHaveBeenCalledTimes(1)

      const firstCall = ClipboardItemMock.mock.calls[0]?.[0] as Record<string, Blob | Promise<Blob>>
      expect(
        firstCall['image/png'] instanceof Blob ||
          firstCall['image/png'] instanceof Promise ||
          firstCall['image/svg+xml'] instanceof Blob
      ).toBe(true)
      expect(firstCall['text/plain']).toBeUndefined()
    })

    it('throws when clipboard image apis are unavailable', async () => {
      // @ts-expect-error - testing unavailable clipboard image path
      delete global.ClipboardItem
      // @ts-expect-error - testing unavailable clipboard image path
      navigator.clipboard.write = undefined

      await expect(copySvgImageToClipboard('<svg></svg>')).rejects.toThrow(
        'Image clipboard API is unavailable'
      )
    })
  })
})
