import { describe, it, expect } from 'vitest'
import { applyPipeline } from './formatter-engine'
import type { TransformationPipeline } from '@/components/formatter/types'

describe('formatter-engine', () => {
  const createPipeline = (steps: TransformationPipeline['steps']): TransformationPipeline => ({
    id: 'test',
    name: 'Test Pipeline',
    icon: 'wand',
    steps
  })

  it('should trim text', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'trim',
      config: {},
      enabled: true
    }])
    expect(applyPipeline('  hello world  ', pipeline)).toBe('hello world')
  })

  it('should replace text', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'replace',
      config: { from: 'foo', to: 'bar' },
      enabled: true
    }])
    expect(applyPipeline('foo baz foo', pipeline)).toBe('bar baz bar')
  })

  it('should change case to upper', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'change-case',
      config: { mode: 'upper' },
      enabled: true
    }])
    expect(applyPipeline('hello', pipeline)).toBe('HELLO')
  })

  it('should change case to lower', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'change-case',
      config: { mode: 'lower' },
      enabled: true
    }])
    expect(applyPipeline('HELLO', pipeline)).toBe('hello')
  })

  it('should change case to title', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'change-case',
      config: { mode: 'title' },
      enabled: true
    }])
    expect(applyPipeline('hello world', pipeline)).toBe('Hello World')
  })

  it('should sort lines ascending', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'sort-lines',
      config: { direction: 'asc' },
      enabled: true
    }])
    expect(applyPipeline('b\na\nc', pipeline)).toBe('a\nb\nc')
  })

  it('should sort lines descending', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'sort-lines',
      config: { direction: 'desc' },
      enabled: true
    }])
    expect(applyPipeline('a\nb\nc', pipeline)).toBe('c\nb\na')
  })
  
  it('should sort lines numerically', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'sort-lines',
      config: { direction: 'asc', numeric: true },
      enabled: true
    }])
    expect(applyPipeline('10\n2\n1', pipeline)).toBe('1\n2\n10')
  })

  it('should join lines', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'join-lines',
      config: { separator: ', ' },
      enabled: true
    }])
    expect(applyPipeline('a\nb\nc', pipeline)).toBe('a, b, c')
  })

  it('should split lines', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'split-lines',
      config: { separator: ',' },
      enabled: true
    }])
    expect(applyPipeline('a,b,c', pipeline)).toBe('a\nb\nc')
  })

  it('should skip disabled steps', () => {
    const pipeline = createPipeline([{
      id: '1',
      operationId: 'change-case',
      config: { mode: 'upper' },
      enabled: false
    }])
    expect(applyPipeline('hello', pipeline)).toBe('hello')
  })

  it('should handle sequential steps', () => {
    const pipeline = createPipeline([
      {
        id: '1',
        operationId: 'trim',
        config: {},
        enabled: true
      },
      {
        id: '2',
        operationId: 'change-case',
        config: { mode: 'upper' },
        enabled: true
      }
    ])
    expect(applyPipeline('  hello  ', pipeline)).toBe('HELLO')
  })
})
