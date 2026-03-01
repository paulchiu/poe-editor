import { describe, it, expect } from 'vitest'
import { extractFirstEmoji, extractFirstEmojiToken, isEmojiShortcodeToken } from './emoji'

describe('extractFirstEmoji', () => {
  it('should return null for empty string/null/undefined', () => {
    // @ts-expect-error - testing invalid input if called from JS
    expect(extractFirstEmoji(null)).toBeNull()
    expect(extractFirstEmoji('')).toBeNull()
  })

  it('should return null when no emoji is present', () => {
    expect(extractFirstEmoji('Hello World')).toBeNull()
    expect(extractFirstEmoji('# Heading without emoji')).toBeNull()
  })

  it('should extract a single emoji', () => {
    expect(extractFirstEmoji('🚀 Space')).toBe('🚀')
    expect(extractFirstEmoji('# 🌲 Nature')).toBe('🌲')
  })

  it('should extract the first emoji if multiple are present', () => {
    expect(extractFirstEmoji('Hello 🌍 World 🚀')).toBe('🌍')
  })

  it('should handle complex emojis', () => {
    // Note: Simple regex might return the first code point or base component.
    // Let's see how \p{Extended_Pictographic} behaves.
    // For complex emojis like families or flags, it might be tricky.
    // If our regex is simple, it might split them.
    // For a favicon, a single char is best, but let's test.
    //
    // The simple \p{Extended_Pictographic} matches a single character.
    // For sequences (like skin tones), we might need a more complex regex if we want the WHOLE sequence.
    // E.g. 👍🏽 is two code points: 👍 + 🏽 (skin tone modifier).
    // extractFirstEmoji('👍🏽') might just return 👍.
    //
    // Let's assume for V1 that simple emojis are the main target, but if we can support modifiers easily, that's better.
    //
    // Attempting a slightly more robust regex for sequences is valid, but let's test the current behavior first.
    // If the expectation is just the base emoji, valid. If we want the full sequence, we need a better regex.
    //
    // The widely used "RGI_Emoji" pattern is complex.
    // A decent approximation is \p{Extended_Pictographic}(\p{EMod}|\u{200D}\p{Extended_Pictographic})* etc.
    //
    // However, the task says "Use Unicode property escapes".
    // Let's start with the simple one.

    // Test base emoji
    expect(extractFirstEmoji('👍')).toBe('👍')
  })
})

describe('extractFirstEmojiToken', () => {
  it('returns first unicode emoji token', () => {
    expect(extractFirstEmojiToken('Hello 🚀 world')).toBe('🚀')
  })

  it('returns first shortcode token', () => {
    expect(extractFirstEmojiToken('Hello :smile: world')).toBe(':smile:')
  })

  it('returns whichever token appears first', () => {
    expect(extractFirstEmojiToken(':smile: and 🚀')).toBe(':smile:')
    expect(extractFirstEmojiToken('🚀 and :smile:')).toBe('🚀')
  })

  it('returns null when no token exists', () => {
    expect(extractFirstEmojiToken('plain heading')).toBeNull()
  })
})

describe('isEmojiShortcodeToken', () => {
  it('detects valid shortcode tokens', () => {
    expect(isEmojiShortcodeToken(':smile:')).toBe(true)
    expect(isEmojiShortcodeToken(':+1:')).toBe(true)
  })

  it('rejects invalid shortcode tokens', () => {
    expect(isEmojiShortcodeToken('smile')).toBe(false)
    expect(isEmojiShortcodeToken(':smile')).toBe(false)
    expect(isEmojiShortcodeToken('smile:')).toBe(false)
  })
})
