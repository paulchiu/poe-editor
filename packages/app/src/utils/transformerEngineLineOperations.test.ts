import { describe, expect, it } from 'vitest'
import { applyLineOperationStep } from '@/utils/transformerEngineLineOperations'
import { createContext, createStep } from '@/utils/transformerEngineTestUtils'

describe('transformerEngineLineOperations', () => {
  it('trims full text by default', () => {
    const result = applyLineOperationStep('  hello world  ', createStep('trim'), createContext())
    expect(result).toBe('hello world')
  })

  it('trims each line when lines is enabled', () => {
    const result = applyLineOperationStep(
      '  line1 \n line2  ',
      createStep('trim', { lines: true }),
      createContext()
    )

    expect(result).toBe('line1\nline2')
  })

  it('filters empty and whitespace-only lines based on trim flag', () => {
    const defaultFilter = applyLineOperationStep('a\n\n  \nb', createStep('filter-lines'), createContext())
    const trimFilter = applyLineOperationStep(
      'a\n\n  \nb',
      createStep('filter-lines', { trim: true }),
      createContext()
    )

    expect(defaultFilter).toBe('a\n  \nb')
    expect(trimFilter).toBe('a\nb')
  })

  it('replaces plain text, regex, and case-insensitive matches', () => {
    const plain = applyLineOperationStep(
      'foo baz foo',
      createStep('replace', { from: 'foo', to: 'bar' }),
      createContext()
    )
    const regex = applyLineOperationStep(
      'item 123 item 456',
      createStep('replace', { from: '\\d+', to: '#', regex: true }),
      createContext()
    )
    const insensitive = applyLineOperationStep(
      'Foo baz FOO',
      createStep('replace', { from: 'foo', to: 'bar', caseInsensitive: true }),
      createContext()
    )

    expect(plain).toBe('bar baz bar')
    expect(regex).toBe('item # item #')
    expect(insensitive).toBe('bar baz bar')
  })

  it('keeps input unchanged for invalid replace regex', () => {
    const result = applyLineOperationStep(
      'foo',
      createStep('replace', { from: '[', to: 'x', regex: true }),
      createContext()
    )

    expect(result).toBe('foo')
  })

  it('supports line-scoped replace anchoring when lines is enabled', () => {
    const perLine = applyLineOperationStep(
      'START item 1\nSTART item 2',
      createStep('replace', { from: '^START', to: '', regex: true, lines: true }),
      createContext()
    )
    const wholeText = applyLineOperationStep(
      'START item 1\nSTART item 2',
      createStep('replace', { from: '^START', to: '', regex: true, lines: false }),
      createContext()
    )

    expect(perLine).toBe(' item 1\n item 2')
    expect(wholeText).toBe(' item 1\nSTART item 2')
  })

  it('sorts lines lexically and numerically', () => {
    const lexical = applyLineOperationStep(
      'b\na\nc',
      createStep('sort-lines', { direction: 'asc' }),
      createContext()
    )
    const numericDesc = applyLineOperationStep(
      '10\n2\n30',
      createStep('sort-lines', { direction: 'desc', numeric: true }),
      createContext()
    )

    expect(lexical).toBe('a\nb\nc')
    expect(numericDesc).toBe('30\n10\n2')
  })

  it('joins and splits lines', () => {
    const joined = applyLineOperationStep(
      'a\nb\nc',
      createStep('join-lines', { separator: ', ' }),
      createContext()
    )
    const split = applyLineOperationStep(
      'a, b, c',
      createStep('split-lines', { separator: ', ' }),
      createContext()
    )

    expect(joined).toBe('a, b, c')
    expect(split).toBe('a\nb\nc')
  })

  it('dedupes lines with keep-first, keep-last, and case-insensitive modes', () => {
    const keepFirst = applyLineOperationStep(
      'a\nb\na\nc\nb',
      createStep('dedupe-lines', { keep: 'first' }),
      createContext()
    )
    const keepLast = applyLineOperationStep(
      'a\nb\na\nc\nb',
      createStep('dedupe-lines', { keep: 'last' }),
      createContext()
    )
    const insensitive = applyLineOperationStep(
      'a\nA\nb',
      createStep('dedupe-lines', { caseSensitive: false }),
      createContext()
    )

    expect(keepFirst).toBe('a\nb\nc')
    expect(keepLast).toBe('a\nc\nb')
    expect(insensitive).toBe('a\nb')
  })

  it('reverses and numbers lines', () => {
    const reversed = applyLineOperationStep('a\nb\nc', createStep('reverse-lines'), createContext())
    const numberedDefault = applyLineOperationStep(
      'a\nb',
      createStep('number-lines'),
      createContext()
    )
    const numberedCustom = applyLineOperationStep(
      'a\nb',
      createStep('number-lines', { start: 10, prefix: '[', separator: '] ' }),
      createContext()
    )

    expect(reversed).toBe('c\nb\na')
    expect(numberedDefault).toBe('1. a\n2. b')
    expect(numberedCustom).toBe('[10] a\n[11] b')
  })

  it('shuffles lines without losing or duplicating content', () => {
    const input = 'a\nb\nc\nd\ne'
    const shuffled = applyLineOperationStep(input, createStep('shuffle-lines'), createContext())

    expect(shuffled?.split('\n').sort()).toEqual(input.split('\n').sort())
  })

  it('wraps lines with prefix and suffix', () => {
    const result = applyLineOperationStep(
      'a\nb',
      createStep('wrap-lines', { prefix: '(', suffix: ')' }),
      createContext()
    )

    expect(result).toBe('(a)\n(b)')
  })

  it('word-wraps lines and force-breaks long words', () => {
    const sentence = applyLineOperationStep(
      'this is a long sentence',
      createStep('word-wrap', { width: 10 }),
      createContext()
    )
    const longWord = applyLineOperationStep(
      'abcdefghij',
      createStep('word-wrap', { width: 5 }),
      createContext()
    )

    expect(sentence).toBe('this is a\nlong\nsentence')
    expect(longWord).toBe('abcde\nfghij')
  })

  it('indents and dedents lines with spaces and tabs', () => {
    const indented = applyLineOperationStep(
      'a\nb',
      createStep('indent', { mode: 'indent', size: 2 }),
      createContext()
    )
    const dedented = applyLineOperationStep(
      '  a\n b',
      createStep('indent', { mode: 'dedent', size: 2 }),
      createContext()
    )
    const tabIndented = applyLineOperationStep(
      'a',
      createStep('indent', { mode: 'indent', useTabs: true }),
      createContext()
    )

    expect(indented).toBe('  a\n  b')
    expect(dedented).toBe('a\nb')
    expect(tabIndented).toBe('\ta')
  })

  it('extracts regex matches and preserves input on invalid patterns', () => {
    const matches = applyLineOperationStep(
      'Item 1, ITEM 20',
      createStep('extract-matches', { pattern: 'item|\\d+', caseInsensitive: true }),
      createContext()
    )
    const invalid = applyLineOperationStep(
      'abc',
      createStep('extract-matches', { pattern: '(' }),
      createContext()
    )

    expect(matches).toBe('Item\n1\nITEM\n20')
    expect(invalid).toBe('abc')
  })

  it('keeps and removes lines by plain text and regex patterns', () => {
    const keepPlain = applyLineOperationStep(
      'foo bar\nbaz\nfoo',
      createStep('keep-lines', { pattern: 'foo' }),
      createContext()
    )
    const keepRegex = applyLineOperationStep(
      'foo bar\nbaz\nnot foo',
      createStep('keep-lines', { pattern: '^foo', regex: true }),
      createContext()
    )
    const removePlain = applyLineOperationStep(
      'foo bar\nbaz\nfoo',
      createStep('remove-lines', { pattern: 'foo' }),
      createContext()
    )

    expect(keepPlain).toBe('foo bar\nfoo')
    expect(keepRegex).toBe('foo bar')
    expect(removePlain).toBe('baz')
  })

  it('returns null for unsupported line operations', () => {
    const result = applyLineOperationStep('hello', createStep('change-case', { mode: 'upper' }), createContext())
    expect(result).toBeNull()
  })
})
