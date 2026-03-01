import { describe, expect, it } from 'vitest'
import { applyDataOperationStep } from '@/utils/transformerEngineDataOperations'
import { createContext, createStep } from '@/utils/transformerEngineTestUtils'

describe('transformerEngineDataOperations', () => {
  it('removes characters by mode', () => {
    const digits = applyDataOperationStep(
      'abc 123 def',
      createStep('remove-chars', { mode: 'digits' }),
      createContext()
    )
    const punctuation = applyDataOperationStep(
      'hello, world!',
      createStep('remove-chars', { mode: 'punctuation' }),
      createContext()
    )
    const custom = applyDataOperationStep(
      'a-b_c',
      createStep('remove-chars', { mode: 'custom', custom: '-_' }),
      createContext()
    )
    const unknown = applyDataOperationStep(
      'hello',
      createStep('remove-chars', { mode: 'unknown' }),
      createContext()
    )

    expect(digits).toBe('abc  def')
    expect(punctuation).toBe('hello world')
    expect(custom).toBe('abc')
    expect(unknown).toBe('hello')
  })

  it('encodes and decodes URL/base64/html values', () => {
    const urlEncoded = applyDataOperationStep(
      'hello world',
      createStep('encode-decode', { mode: 'url-encode' }),
      createContext()
    )
    const urlDecoded = applyDataOperationStep(
      'hello%20world',
      createStep('encode-decode', { mode: 'url-decode' }),
      createContext()
    )
    const base64Encoded = applyDataOperationStep(
      'hello',
      createStep('encode-decode', { mode: 'base64-encode' }),
      createContext()
    )
    const base64Decoded = applyDataOperationStep(
      'aGVsbG8=',
      createStep('encode-decode', { mode: 'base64-decode' }),
      createContext()
    )
    const htmlEncoded = applyDataOperationStep(
      'A&B',
      createStep('encode-decode', { mode: 'html-encode' }),
      createContext()
    )
    const htmlDecoded = applyDataOperationStep(
      'Tom &amp; Jerry',
      createStep('encode-decode', { mode: 'html-decode' }),
      createContext()
    )
    const invalidDecode = applyDataOperationStep(
      '%bad',
      createStep('encode-decode', { mode: 'url-decode' }),
      createContext()
    )

    expect(urlEncoded).toBe('hello%20world')
    expect(urlDecoded).toBe('hello world')
    expect(base64Encoded).toBe('aGVsbG8=')
    expect(base64Decoded).toBe('hello')
    expect(htmlEncoded).toBe('A&#38;B')
    expect(htmlDecoded).toBe('Tom & Jerry')
    expect(invalidDecode).toBe('%bad')
  })

  it('formats whole-input JSON and reports invalid input issues', () => {
    const context = createContext()
    const valid = applyDataOperationStep(
      '{"name":"poe","tags":["md","editor"]}',
      createStep('format-json'),
      context
    )

    expect(valid).toBe('{\n  "name": "poe",\n  "tags": [\n    "md",\n    "editor"\n  ]\n}')
    expect(context.issues).toHaveLength(0)

    const invalidContext = createContext()
    const invalid = applyDataOperationStep('{"bad":}', createStep('format-json'), invalidContext)
    expect(invalid).toBe('{"bad":}')
    expect(invalidContext.issues).toHaveLength(1)
    expect(invalidContext.issues[0]?.code).toBe('invalid-json-input')
  })

  it('formats line-based JSON and records invalid JSON object lines', () => {
    const context = createContext()
    const output = applyDataOperationStep(
      '{"ok":1}\n[]\n{"bad":}\n{"alsoOk":{"nested":true}}',
      createStep('format-json', { lines: true }, true, 'json-step'),
      context
    )

    expect(output).toBe(
      '{\n  "ok": 1\n}\n[]\n{"bad":}\n{\n  "alsoOk": {\n    "nested": true\n  }\n}'
    )
    expect(context.issues).toHaveLength(2)
    expect(context.issues[0]).toMatchObject({
      stepId: 'json-step',
      code: 'invalid-json-line',
      line: 2,
    })
    expect(context.issues[1]).toMatchObject({
      stepId: 'json-step',
      code: 'invalid-json-line',
      line: 3,
    })
  })

  it('strips HTML and script/style content', () => {
    const output = applyDataOperationStep(
      '<style>.x{}</style><script>alert(1)</script><div>Hello <strong>world</strong> &amp; all</div>',
      createStep('strip-html'),
      createContext()
    )

    expect(output).toBe('Hello world & all')
  })

  it('escapes and unescapes JSON and regex text', () => {
    const escaped = applyDataOperationStep(
      'line 1\nline 2',
      createStep('escape', { mode: 'json-escape' }),
      createContext()
    )
    const unescaped = applyDataOperationStep(
      'line 1\\nline 2',
      createStep('escape', { mode: 'json-unescape' }),
      createContext()
    )
    const regexEscaped = applyDataOperationStep(
      'a+b*c?',
      createStep('escape', { mode: 'regex-escape' }),
      createContext()
    )
    const invalidUnescape = applyDataOperationStep(
      '\\x',
      createStep('escape', { mode: 'json-unescape' }),
      createContext()
    )

    expect(escaped).toBe('line 1\\nline 2')
    expect(unescaped).toBe('line 1\nline 2')
    expect(regexEscaped).toBe('a\\+b\\*c\\?')
    expect(invalidUnescape).toBe('\\x')
  })

  it('pads and aligns text', () => {
    const right = applyDataOperationStep(
      '1\n12',
      createStep('pad-align', { width: 5, align: 'right', char: '0' }),
      createContext()
    )
    const left = applyDataOperationStep(
      '1',
      createStep('pad-align', { width: 3, align: 'left', char: '.' }),
      createContext()
    )
    const center = applyDataOperationStep(
      '1',
      createStep('pad-align', { width: 5, align: 'center', char: '_' }),
      createContext()
    )

    expect(right).toBe('00001\n00012')
    expect(left).toBe('1..')
    expect(center).toBe('__1__')
  })

  it('formats and increments numbers', () => {
    const formatted = applyDataOperationStep(
      '1234.5',
      createStep('format-numbers', { thousands: true, decimals: 2 }),
      createContext()
    )
    const incremented = applyDataOperationStep(
      'item 1 cost 5.50',
      createStep('increment-numbers', { delta: 10 }),
      createContext()
    )

    expect(formatted).toContain('1,234.50')
    expect(incremented).toBe('item 11 cost 15.50')
  })

  it('returns null for unsupported data operations', () => {
    const result = applyDataOperationStep('abc', createStep('trim'), createContext())
    expect(result).toBeNull()
  })
})
