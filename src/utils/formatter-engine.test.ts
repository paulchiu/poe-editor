import { describe, it, expect } from 'vitest'
import { applyPipeline } from './formatter-engine'
import type { TransformationPipeline } from '@/components/formatter/types'

describe('formatter-engine', () => {
  const createPipeline = (steps: TransformationPipeline['steps']): TransformationPipeline => ({
    id: 'test',
    name: 'Test Pipeline',
    icon: 'wand',
    steps,
  })

  // --- TRIM ---
  it('should trim text (global default)', () => {
    const pipeline = createPipeline([{ id: '1', operationId: 'trim', config: {}, enabled: true }])
    expect(applyPipeline('  hello world  ', pipeline)).toBe('hello world')
  })

  it('should trim each line individually', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'trim', config: { lines: true }, enabled: true },
    ])
    expect(applyPipeline('  line1 \n line2  ', pipeline)).toBe('line1\nline2')
  })

  // --- REPLACE ---
  it('should replace text (simple)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'replace', config: { from: 'foo', to: 'bar' }, enabled: true },
    ])
    expect(applyPipeline('foo baz foo', pipeline)).toBe('bar baz bar')
  })

  it('should replace text with regex', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'replace',
        config: { from: '\\d+', to: '#', regex: true },
        enabled: true,
      },
    ])
    expect(applyPipeline('item 123 item 456', pipeline)).toBe('item # item #')
  })

  it('should replace text case insensitive', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'replace',
        config: { from: 'foo', to: 'bar', caseInsensitive: true },
        enabled: true,
      },
    ])
    expect(applyPipeline('Foo baz FOO', pipeline)).toBe('bar baz bar')
  })

  it('should replace per line with anchors', () => {
    // With lines: true, ^ matches start of each line
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'replace',
        config: { from: '^START', to: '', regex: true, lines: true },
        enabled: true,
      },
    ])
    expect(applyPipeline('START item 1\nSTART item 2', pipeline)).toBe(' item 1\n item 2')
  })

  it('should replace globally ignoring anchors without multiline flag if lines is false', () => {
    // Normal JS RegExp without 'm' flag: ^ only matches start of whole string.
    // So 'START item 2' on second line won't match ^START
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'replace',
        config: { from: '^START', to: '', regex: true, lines: false },
        enabled: true,
      },
    ])
    expect(applyPipeline('START item 1\nSTART item 2', pipeline)).toBe(' item 1\nSTART item 2')
  })

  // --- CHANGE CASE ---
  it('should change case to upper', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'upper' }, enabled: true },
    ])
    expect(applyPipeline('hello', pipeline)).toBe('HELLO')
  })

  it('should change case to lower', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'lower' }, enabled: true },
    ])
    expect(applyPipeline('HELLO', pipeline)).toBe('hello')
  })

  it('should change case to title', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'title' }, enabled: true },
    ])
    expect(applyPipeline('hello world', pipeline)).toBe('Hello World')
  })

  it('should change case to camel (per line default)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'camel' }, enabled: true },
    ])
    expect(applyPipeline('hello world\nfoo bar', pipeline)).toBe('helloWorld\nfooBar')
  })

  it('should change case to camel (whole text)', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'change-case',
        config: { mode: 'camel', lines: false },
        enabled: true,
      },
    ])
    // camelCase usually removes separators. 'hello world\nfoo bar' -> 'helloWorldFooBar'
    expect(applyPipeline('hello world\nfoo bar', pipeline)).toBe('helloWorldFooBar')
  })

  it('should change case to snake', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'snake' }, enabled: true },
    ])
    expect(applyPipeline('hello world', pipeline)).toBe('hello_world')
  })

  it('should change case to kebab', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'kebab' }, enabled: true },
    ])
    expect(applyPipeline('Hello World', pipeline)).toBe('hello-world')
  })

  // --- FILTER LINES ---
  it('should remove empty steps', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'filter-lines', config: {}, enabled: true },
    ])
    // The filter checks length > 0. A line containing spaces has length > 0.
    // 'a\n\nb' -> split: ['a', '', 'b'] -> filter: ['a', 'b'] -> join: 'a\nb'
    expect(applyPipeline('a\n\nb', pipeline)).toBe('a\nb')
  })

  it('should remove whitespace-only lines if configured', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'filter-lines', config: { trim: true }, enabled: true },
    ])
    // 'a\n  \nb' -> split: ['a', '  ', 'b']
    // trim=true: '  '.trim().length is 0.
    expect(applyPipeline('a\n  \nb', pipeline)).toBe('a\nb')
  })

  // --- OTHER ---
  it('should sort lines ascending', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'sort-lines', config: { direction: 'asc' }, enabled: true },
    ])
    expect(applyPipeline('b\na\nc', pipeline)).toBe('a\nb\nc')
  })

  it('should join lines', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'join-lines', config: { separator: ', ' }, enabled: true },
    ])
    expect(applyPipeline('a\nb\nc', pipeline)).toBe('a, b, c')
  })

  // --- DEDUPE ---
  it('should remove duplicate lines (keep first)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'dedupe-lines', config: { keep: 'first' }, enabled: true },
    ])
    expect(applyPipeline('a\nb\na\nc\nb', pipeline)).toBe('a\nb\nc')
  })

  it('should remove duplicate lines (keep last)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'dedupe-lines', config: { keep: 'last' }, enabled: true },
    ])
    expect(applyPipeline('a\nb\na\nc\nb', pipeline)).toBe('a\nc\nb')
  })

  it('should remove duplicate lines (case insensitive)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'dedupe-lines', config: { caseSensitive: false }, enabled: true },
    ])
    expect(applyPipeline('a\nA\nb', pipeline)).toBe('a\nb')
  })

  // --- REVERSE ---
  it('should reverse lines', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'reverse-lines', config: {}, enabled: true },
    ])
    expect(applyPipeline('a\nb\nc', pipeline)).toBe('c\nb\na')
  })

  // --- NUMBER ---
  it('should number lines (default)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'number-lines', config: {}, enabled: true },
    ])
    expect(applyPipeline('a\nb', pipeline)).toBe('1. a\n2. b')
  })

  it('should number lines (custom)', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'number-lines',
        config: { start: 10, prefix: '[', separator: '] ' },
        enabled: true,
      },
    ])
    expect(applyPipeline('a\nb', pipeline)).toBe('[10] a\n[11] b')
  })

  // --- SHUFFLE ---
  it('should shuffle lines', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'shuffle-lines', config: {}, enabled: true },
    ])
    const input = 'a\nb\nc\nd\ne'
    const output = applyPipeline(input, pipeline)
    expect(output.split('\n').sort()).toEqual(input.split('\n').sort())
  })

  // --- WRAP ---
  it('should wrap lines with prefix and suffix', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'wrap-lines', config: { prefix: '(', suffix: ')' }, enabled: true },
    ])
    expect(applyPipeline('a\nb', pipeline)).toBe('(a)\n(b)')
  })

  // --- WORD WRAP ---
  it('should word wrap lines at width', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'word-wrap', config: { width: 10 }, enabled: true },
    ])
    expect(applyPipeline('this is a long sentence', pipeline)).toBe('this is a\nlong\nsentence')
  })

  it('should force break long words in word wrap', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'word-wrap', config: { width: 5 }, enabled: true },
    ])
    expect(applyPipeline('abcdefghij', pipeline)).toBe('abcde\nfghij')
  })

  // --- INDENT ---
  it('should indent lines', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'indent', config: { mode: 'indent', size: 2 }, enabled: true },
    ])
    expect(applyPipeline('a\nb', pipeline)).toBe('  a\n  b')
  })

  it('should dedent lines', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'indent', config: { mode: 'dedent', size: 2 }, enabled: true },
    ])
    expect(applyPipeline('  a\n  b', pipeline)).toBe('a\nb')
  })

  it('should use tabs for indent', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'indent', config: { mode: 'indent', useTabs: true }, enabled: true },
    ])
    expect(applyPipeline('a', pipeline)).toBe('\ta')
  })

  // --- EXTRACTION ---
  it('should extract regex matches', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'extract-matches', config: { pattern: '\\d+' }, enabled: true },
    ])
    expect(applyPipeline('item 1, price 20', pipeline)).toBe('1\n20')
  })

  it('should extract matches case insensitive', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'extract-matches',
        config: { pattern: 'item', caseInsensitive: true },
        enabled: true,
      },
    ])
    expect(applyPipeline('Item 1, ITEM 2', pipeline)).toBe('Item\nITEM')
  })

  // --- FILTERING ---
  it('should keep lines matching pattern (plain text)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'keep-lines', config: { pattern: 'foo' }, enabled: true },
    ])
    expect(applyPipeline('foo bar\nbaz\nfoo', pipeline)).toBe('foo bar\nfoo')
  })

  it('should keep lines matching regex', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'keep-lines',
        config: { pattern: '^foo', regex: true },
        enabled: true,
      },
    ])
    expect(applyPipeline('foo bar\nbaz\nnot foo', pipeline)).toBe('foo bar')
  })

  it('should remove lines matching pattern', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'remove-lines', config: { pattern: 'foo' }, enabled: true },
    ])
    expect(applyPipeline('foo bar\nbaz\nfoo', pipeline)).toBe('baz')
  })

  // --- CHARACTER OPS ---
  it('should remove digits', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'remove-chars', config: { mode: 'digits' }, enabled: true },
    ])
    expect(applyPipeline('abc 123 def', pipeline)).toBe('abc  def')
  })

  it('should remove punctuation', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'remove-chars', config: { mode: 'punctuation' }, enabled: true },
    ])
    expect(applyPipeline('hello, world!', pipeline)).toBe('hello world')
  })

  it('should encode/decode URL', () => {
    const pipelineEnc = createPipeline([
      { id: '1', operationId: 'encode-decode', config: { mode: 'url-encode' }, enabled: true },
    ])
    const pipelineDec = createPipeline([
      { id: '2', operationId: 'encode-decode', config: { mode: 'url-decode' }, enabled: true },
    ])
    const input = 'hello world'
    const encoded = applyPipeline(input, pipelineEnc)
    expect(encoded).toBe('hello%20world')
    expect(applyPipeline(encoded, pipelineDec)).toBe(input)
  })

  it('should escape/unescape JSON', () => {
    const pipelineEnc = createPipeline([
      { id: '1', operationId: 'escape', config: { mode: 'json-escape' }, enabled: true },
    ])
    const pipelineDec = createPipeline([
      { id: '2', operationId: 'escape', config: { mode: 'json-unescape' }, enabled: true },
    ])
    const input = 'line 1\nline 2'
    const encoded = applyPipeline(input, pipelineEnc)
    expect(encoded).toBe('line 1\\nline 2')
    expect(applyPipeline(encoded, pipelineDec)).toBe(input)
  })

  // --- NUMERIC/DATA ---
  it('should pad lines', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'pad-align',
        config: { width: 5, align: 'right', char: '0' },
        enabled: true,
      },
    ])
    expect(applyPipeline('1\n12', pipeline)).toBe('00001\n00012')
  })

  it('should format numbers', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'format-numbers',
        config: { thousands: true, decimals: 2 },
        enabled: true,
      },
    ])
    // Note: toLocaleString behavior can vary by locale, but the test environment usually has a stable one.
    // In US locale (default usually), thousands separator is comma.
    expect(applyPipeline('1234.5', pipeline)).toContain('1,234.50')
  })

  it('should increment numbers', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'increment-numbers', config: { delta: 10 }, enabled: true },
    ])
    expect(applyPipeline('item 1 cost 5.50', pipeline)).toBe('item 11 cost 15.50')
  })

  // --- MARKDOWN/CODE ---
  it('should slugify text (line-by-line default)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'slugify', config: {}, enabled: true },
    ])
    expect(applyPipeline('Hello World! This is a test.', pipeline)).toBe(
      'hello-world-this-is-a-test'
    )
  })

  it('should slugify each line independently', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'slugify', config: { lines: true }, enabled: true },
    ])
    expect(applyPipeline('Hello World!\nThis is a test.', pipeline)).toBe(
      'hello-world\nthis-is-a-test'
    )
  })

  it('should slugify whole text as single slug', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'slugify', config: { lines: false }, enabled: true },
    ])
    expect(applyPipeline('Hello World!\nThis is a test.', pipeline)).toBe(
      'hello-world-this-is-a-test'
    )
  })


  it('should quote/unquote lines (default line mode)', () => {
    const pipelineAdd = createPipeline([
      { id: '1', operationId: 'quote', config: { mode: 'add', char: '"' }, enabled: true },
    ])
    const pipelineRem = createPipeline([
      { id: '2', operationId: 'quote', config: { mode: 'remove', char: '"' }, enabled: true },
    ])
    const input = 'a\nb'
    const quoted = applyPipeline(input, pipelineAdd)
    expect(quoted).toBe('"a"\n"b"')
    expect(applyPipeline(quoted, pipelineRem)).toBe(input)
  })

  it('should quote/unquote whole selection', () => {
    const pipelineAdd = createPipeline([
      { id: '1', operationId: 'quote', config: { mode: 'add', char: '"', lines: false }, enabled: true },
    ])
    const pipelineRem = createPipeline([
      { id: '2', operationId: 'quote', config: { mode: 'remove', char: '"', lines: false }, enabled: true },
    ])
    const input = 'a\nb'
    const quoted = applyPipeline(input, pipelineAdd)
    expect(quoted).toBe('"a\nb"')
    expect(applyPipeline(quoted, pipelineRem)).toBe(input)
  })

  it('should quote with custom character (line mode)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'quote', config: { mode: 'add', char: "'" }, enabled: true },
    ])
    expect(applyPipeline('hello\nworld', pipeline)).toBe("'hello'\n'world'")
  })

  it('should quote with custom character (whole selection)', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'quote', config: { mode: 'add', char: "'", lines: false }, enabled: true },
    ])
    expect(applyPipeline('hello\nworld', pipeline)).toBe("'hello\nworld'")
  })

  it('should skip disabled steps', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'upper' }, enabled: false },
    ])
    expect(applyPipeline('hello', pipeline)).toBe('hello')
  })
})
