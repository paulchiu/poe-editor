import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('filterEmojiShortcodeEntries', () => {
  it('ranks prefix matches before contains matches', async () => {
    const { filterEmojiShortcodeEntries } = await import('./emojiShortcodes')
    const entries = [
      { shortcode: 'heart_eyes', emoji: '😍' },
      { shortcode: 'smile', emoji: '😄' },
      { shortcode: 'upside_down_face', emoji: '🙃' },
      { shortcode: 'smiley', emoji: '😃' },
    ]

    const result = filterEmojiShortcodeEntries(entries, 'smi', 10)

    expect(result.map((entry) => entry.shortcode)).toEqual(['smile', 'smiley'])
  })

  it('returns all entries for empty query and enforces limit', async () => {
    const { filterEmojiShortcodeEntries } = await import('./emojiShortcodes')
    const entries = [
      { shortcode: 'b', emoji: '🅱️' },
      { shortcode: 'a', emoji: '🅰️' },
      { shortcode: 'c', emoji: '©️' },
    ]

    const result = filterEmojiShortcodeEntries(entries, '', 2)

    expect(result).toHaveLength(2)
    expect(result.map((entry) => entry.shortcode)).toEqual(['a', 'b'])
  })
})

describe('getEmojiShortcodeEntries', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('markdown-it-emoji/lib/data/full.mjs')
    vi.resetModules()
  })

  it('lazy-loads shortcode data and reuses cache', async () => {
    const emojiDataFactory = vi.fn(() => ({
      default: {
        smile: '😄',
        '+1': '👍',
      },
    }))

    vi.doMock('markdown-it-emoji/lib/data/full.mjs', emojiDataFactory)
    const { getEmojiShortcodeEntries, resetEmojiShortcodeCacheForTests } =
      await import('./emojiShortcodes')
    resetEmojiShortcodeCacheForTests()

    const first = await getEmojiShortcodeEntries()
    const second = await getEmojiShortcodeEntries()

    expect(emojiDataFactory).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
    expect(first.map((entry) => entry.shortcode)).toEqual(['+1', 'smile'])
  })
})
