import { describe, expect, it } from 'vitest'
import {
  applyPipeline,
  applyPipelineWithIssues,
  getPipelineIssueSummary,
} from '@/utils/transformer-engine'
import type { TransformationIssue } from '@/utils/transformerEngineTypes'
import { createPipeline, createStep } from '@/utils/transformerEngineTestUtils'

describe('transformer-engine', () => {
  it('applies enabled steps in sequence', () => {
    const pipeline = createPipeline([
      createStep('trim'),
      createStep('change-case', { mode: 'upper' }, true, 'step-2'),
      createStep('quote', { mode: 'add', char: '"', lines: false }, true, 'step-3'),
    ])

    const result = applyPipeline('  hello world  ', pipeline)
    expect(result).toBe('"HELLO WORLD"')
  })

  it('skips disabled steps', () => {
    const pipeline = createPipeline([
      createStep('change-case', { mode: 'upper' }, false),
      createStep('trim'),
    ])

    expect(applyPipeline('  hello  ', pipeline)).toBe('hello')
  })

  it('collects issues when using applyPipelineWithIssues', () => {
    const pipeline = createPipeline([createStep('format-json', { lines: true }, true, 'json-step')])

    const result = applyPipelineWithIssues('{"ok":1}\n{"bad":}', pipeline)

    expect(result.output).toBe('{\n  "ok": 1\n}\n{"bad":}')
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]).toMatchObject({
      stepId: 'json-step',
      operationId: 'format-json',
      code: 'invalid-json-line',
      line: 2,
    })
  })

  it('returns null summary for empty issues', () => {
    expect(getPipelineIssueSummary([])).toBeNull()
  })

  it('summarizes invalid whole-input JSON issues', () => {
    const issues: TransformationIssue[] = [
      {
        stepId: '1',
        operationId: 'format-json',
        code: 'invalid-json-input',
        message: 'Input is not valid JSON',
      },
    ]

    expect(getPipelineIssueSummary(issues)).toBe('Format JSON requires valid JSON input')
  })

  it('summarizes invalid line count with singular and plural forms', () => {
    const singular: TransformationIssue[] = [
      {
        stepId: '1',
        operationId: 'format-json',
        code: 'invalid-json-line',
        message: 'Line 1 is not a valid JSON object',
        line: 1,
      },
    ]
    const plural: TransformationIssue[] = [
      ...singular,
      {
        stepId: '1',
        operationId: 'format-json',
        code: 'invalid-json-line',
        message: 'Line 2 is not a valid JSON object',
        line: 2,
      },
    ]

    expect(getPipelineIssueSummary(singular)).toBe('Format JSON skipped 1 invalid line')
    expect(getPipelineIssueSummary(plural)).toBe('Format JSON skipped 2 invalid lines')
  })

  it('summarizes mixed invalid line and invalid input issues', () => {
    const issues: TransformationIssue[] = [
      {
        stepId: '1',
        operationId: 'format-json',
        code: 'invalid-json-line',
        message: 'Line 1 is not a valid JSON object',
        line: 1,
      },
      {
        stepId: '1',
        operationId: 'format-json',
        code: 'invalid-json-input',
        message: 'Input is not valid JSON',
      },
    ]

    expect(getPipelineIssueSummary(issues)).toBe(
      'Format JSON skipped 1 invalid line and found invalid JSON input'
    )
  })
})
