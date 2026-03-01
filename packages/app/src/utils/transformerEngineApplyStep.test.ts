import { describe, expect, it } from 'vitest'
import type { PipelineStep } from '@/components/transformer/types'
import { applyStep } from '@/utils/transformerEngineApplyStep'
import { createContext, createStep } from '@/utils/transformerEngineTestUtils'

describe('transformerEngineApplyStep', () => {
  it('returns input unchanged when step is disabled', () => {
    const step = createStep('trim', {}, false)
    const result = applyStep('  keep me  ', step, createContext())

    expect(result).toBe('  keep me  ')
  })

  it('applies line operation handlers first', () => {
    const step = createStep('trim', { lines: true })
    const result = applyStep('  one  \n two ', step, createContext())

    expect(result).toBe('one\ntwo')
  })

  it('applies text operation handlers when line handlers do not match', () => {
    const step = createStep('change-case', { mode: 'upper' })
    const result = applyStep('hello world', step, createContext())

    expect(result).toBe('HELLO WORLD')
  })

  it('applies data operation handlers when other handlers do not match', () => {
    const step = createStep('remove-chars', { mode: 'digits' })
    const result = applyStep('a1b2c3', step, createContext())

    expect(result).toBe('abc')
  })

  it('returns input unchanged when no handler supports the operation', () => {
    const step: PipelineStep = {
      id: 'unknown-step',
      operationId: 'unknown-op' as PipelineStep['operationId'],
      config: {},
      enabled: true,
    }

    const result = applyStep('unchanged', step, createContext())
    expect(result).toBe('unchanged')
  })
})
