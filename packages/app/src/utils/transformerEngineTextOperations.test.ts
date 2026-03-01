import { describe, expect, it } from 'vitest'
import { applyTextOperationStep } from '@/utils/transformerEngineTextOperations'
import { createContext, createStep } from '@/utils/transformerEngineTestUtils'

describe('transformerEngineTextOperations', () => {
  it('changes case for standard modes', () => {
    const upper = applyTextOperationStep(
      'hello',
      createStep('change-case', { mode: 'upper' }),
      createContext()
    )
    const lower = applyTextOperationStep(
      'HELLO',
      createStep('change-case', { mode: 'lower' }),
      createContext()
    )
    const title = applyTextOperationStep(
      'hello world',
      createStep('change-case', { mode: 'title' }),
      createContext()
    )

    expect(upper).toBe('HELLO')
    expect(lower).toBe('hello')
    expect(title).toBe('Hello World')
  })

  it('changes case for naming-style modes', () => {
    const camelPerLine = applyTextOperationStep(
      'hello world\nfoo bar',
      createStep('change-case', { mode: 'camel' }),
      createContext()
    )
    const camelWholeText = applyTextOperationStep(
      'hello world\nfoo bar',
      createStep('change-case', { mode: 'camel', lines: false }),
      createContext()
    )
    const snake = applyTextOperationStep(
      'hello world',
      createStep('change-case', { mode: 'snake' }),
      createContext()
    )
    const kebab = applyTextOperationStep(
      'Hello World',
      createStep('change-case', { mode: 'kebab' }),
      createContext()
    )
    const pascal = applyTextOperationStep(
      'hello world',
      createStep('change-case', { mode: 'pascal' }),
      createContext()
    )
    const constant = applyTextOperationStep(
      'hello world',
      createStep('change-case', { mode: 'constant' }),
      createContext()
    )

    expect(camelPerLine).toBe('helloWorld\nfooBar')
    expect(camelWholeText).toBe('helloWorldFooBar')
    expect(snake).toBe('hello_world')
    expect(kebab).toBe('hello-world')
    expect(pascal).toBe('HelloWorld')
    expect(constant).toBe('HELLO_WORLD')
  })

  it('returns input for unknown case mode', () => {
    const result = applyTextOperationStep(
      'keep me',
      createStep('change-case', { mode: 'unknown-mode' }),
      createContext()
    )

    expect(result).toBe('keep me')
  })

  it('slugifies text in whole-text and per-line modes', () => {
    const wholeText = applyTextOperationStep(
      'Hello World!\nThis is a test.',
      createStep('slugify'),
      createContext()
    )
    const perLine = applyTextOperationStep(
      'Hello World!\nThis is a test.',
      createStep('slugify', { lines: true }),
      createContext()
    )

    expect(wholeText).toBe('hello-world-this-is-a-test')
    expect(perLine).toBe('hello-world\nthis-is-a-test')
  })

  it('adds and removes quotes in line and whole-text modes', () => {
    const addPerLine = applyTextOperationStep(
      'a\nb',
      createStep('quote', { mode: 'add', char: '"' }),
      createContext()
    )
    const removePerLine = applyTextOperationStep(
      '"a"\n"b"',
      createStep('quote', { mode: 'remove', char: '"' }),
      createContext()
    )
    const addWhole = applyTextOperationStep(
      'a\nb',
      createStep('quote', { mode: 'add', char: "'", lines: false }),
      createContext()
    )
    const removeWhole = applyTextOperationStep(
      "'a\nb'",
      createStep('quote', { mode: 'remove', char: "'", lines: false }),
      createContext()
    )

    expect(addPerLine).toBe('"a"\n"b"')
    expect(removePerLine).toBe('a\nb')
    expect(addWhole).toBe("'a\nb'")
    expect(removeWhole).toBe('a\nb')
  })

  it('returns null for unsupported text operations', () => {
    const result = applyTextOperationStep('abc', createStep('trim'), createContext())
    expect(result).toBeNull()
  })
})
