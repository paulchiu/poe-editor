import { describe, it, expect } from 'vitest'
import {
  generateId,
  validatePipelineName,
  validatePipelineSteps,
  buildPipeline,
} from './pipelineUtils'
import type { PipelineStep } from './types'

describe('pipelineUtils', () => {
  describe('generateId', () => {
    it('returns a 7-character string', () => {
      const id = generateId()
      expect(id).toHaveLength(7)
    })

    it('returns alphanumeric characters', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()))
      expect(ids.size).toBeGreaterThan(90)
    })
  })

  describe('validatePipelineName', () => {
    it('returns error for empty string', () => {
      expect(validatePipelineName('')).toBe('Please enter a name for your pipeline')
    })

    it('returns error for whitespace-only string', () => {
      expect(validatePipelineName('   ')).toBe('Please enter a name for your pipeline')
    })

    it('returns null for valid name', () => {
      expect(validatePipelineName('My Pipeline')).toBeNull()
    })

    it('returns null for name with leading/trailing whitespace', () => {
      expect(validatePipelineName('  My Pipeline  ')).toBeNull()
    })
  })

  describe('validatePipelineSteps', () => {
    it('returns error for empty steps array with saving action', () => {
      expect(validatePipelineSteps([], 'saving')).toBe(
        'Add at least one step to the pipeline before saving'
      )
    })

    it('returns error for empty steps array with applying action', () => {
      expect(validatePipelineSteps([], 'applying')).toBe(
        'Add at least one step to the pipeline before applying'
      )
    })

    it('returns error for empty steps array with saving and applying action', () => {
      expect(validatePipelineSteps([], 'saving and applying')).toBe(
        'Add at least one step to the pipeline before saving and applying'
      )
    })

    it('returns null for non-empty steps array', () => {
      const steps: PipelineStep[] = [{ id: '1', operationId: 'trim', config: {}, enabled: true }]
      expect(validatePipelineSteps(steps, 'saving')).toBeNull()
    })
  })

  describe('buildPipeline', () => {
    it('builds pipeline with provided id', () => {
      const steps: PipelineStep[] = [{ id: '1', operationId: 'trim', config: {}, enabled: true }]
      const pipeline = buildPipeline({ id: 'test-id', name: 'Test', icon: '🔧', steps })
      expect(pipeline.id).toBe('test-id')
      expect(pipeline.name).toBe('Test')
      expect(pipeline.icon).toBe('🔧')
      expect(pipeline.steps).toBe(steps)
    })

    it('generates id when not provided', () => {
      const pipeline = buildPipeline({ name: 'Test', icon: '🔧', steps: [] })
      expect(pipeline.id).toHaveLength(7)
    })

    it('uses default icon when empty string provided', () => {
      const pipeline = buildPipeline({ name: 'Test', icon: '', steps: [] })
      expect(pipeline.icon).toBe('🪄')
    })
  })
})
