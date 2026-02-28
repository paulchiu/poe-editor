import { describe, expect, it } from 'vitest'
import { buildEditorOptions } from './editorOptions'

describe('buildEditorOptions', () => {
  it('sets line numbers on when enabled', () => {
    const options = buildEditorOptions(true)

    expect(options.lineNumbers).toBe('on')
  })

  it('sets line numbers off when disabled', () => {
    const options = buildEditorOptions(false)

    expect(options.lineNumbers).toBe('off')
  })

  it('disables built-in autocomplete suggestions to avoid emoji picker conflicts', () => {
    const options = buildEditorOptions(true)

    expect(options.quickSuggestions).toBe(false)
    expect(options.suggestOnTriggerCharacters).toBe(false)
    expect(options.wordBasedSuggestions).toBe('off')
    expect(options.inlineSuggest).toEqual({ enabled: false })
  })
})
