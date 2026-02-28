import { describe, expect, it } from 'vitest'
import { getEmojiShortcodeQueryAtCursor, isInsideFencedCodeBlock } from './emojiPickerQuery'

interface TestModel {
  getLineContent: (lineNumber: number) => string
}

function createModel(lines: string[]): TestModel {
  return {
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
  }
}

describe('isInsideFencedCodeBlock', () => {
  it('returns true when cursor is inside fenced block', () => {
    const model = createModel(['```', ':smile', '```'])

    expect(isInsideFencedCodeBlock(model, { lineNumber: 2, column: 7 })).toBe(true)
  })

  it('returns false when cursor is outside fenced block', () => {
    const model = createModel(['Text', ':smile'])

    expect(isInsideFencedCodeBlock(model, { lineNumber: 2, column: 7 })).toBe(false)
  })
})

describe('getEmojiShortcodeQueryAtCursor', () => {
  it('extracts active shortcode query details', () => {
    const model = createModel(['Hello :smi'])

    expect(getEmojiShortcodeQueryAtCursor(model, { lineNumber: 1, column: 11 })).toEqual({
      query: 'smi',
      lineNumber: 1,
      startColumn: 7,
      endColumn: 11,
    })
  })

  it('returns null for escaped shortcode patterns', () => {
    const model = createModel(['\\:smile'])

    expect(getEmojiShortcodeQueryAtCursor(model, { lineNumber: 1, column: 8 })).toBeNull()
  })

  it('returns null when shortcode is already complete', () => {
    const model = createModel(['Done :smile:'])

    expect(getEmojiShortcodeQueryAtCursor(model, { lineNumber: 1, column: 13 })).toBeNull()
  })

  it('returns null for inline code spans', () => {
    const model = createModel(['Use `:smi'])

    expect(getEmojiShortcodeQueryAtCursor(model, { lineNumber: 1, column: 10 })).toBeNull()
  })

  it('returns null when inside fenced code blocks', () => {
    const model = createModel(['```', ':smile', '```'])

    expect(getEmojiShortcodeQueryAtCursor(model, { lineNumber: 2, column: 7 })).toBeNull()
  })
})
