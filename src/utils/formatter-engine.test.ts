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

  it('should skip disabled steps', () => {
    const pipeline = createPipeline([
      { id: '1', operationId: 'change-case', config: { mode: 'upper' }, enabled: false },
    ])
    expect(applyPipeline('hello', pipeline)).toBe('hello')
  })
})
