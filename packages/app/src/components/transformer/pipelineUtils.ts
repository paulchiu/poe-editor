import type { PipelineStep, TransformationPipeline } from './types'

/**
 * Generates a random alphanumeric ID.
 * @returns A 7-character random string
 */
export const generateId = (): string => Math.random().toString(36).substring(2, 9)

/**
 * Validates a pipeline has a non-empty name.
 * @param name - The pipeline name to validate
 * @returns Error message string if invalid, null if valid
 */
export function validatePipelineName(name: string): string | null {
  if (!name.trim()) {
    return 'Please enter a name for your pipeline'
  }
  return null
}

/**
 * Validates that a pipeline has at least one step.
 * @param steps - The pipeline steps array
 * @param action - The action being performed (for error message customization)
 * @returns Error message string if invalid, null if valid
 */
export function validatePipelineSteps(
  steps: PipelineStep[],
  action: 'saving' | 'applying' | 'saving and applying'
): string | null {
  if (steps.length === 0) {
    return `Add at least one step to the pipeline before ${action}`
  }
  return null
}

/**
 * Builds a TransformationPipeline object from its parts.
 * @param params - Pipeline construction parameters
 * @returns A complete TransformationPipeline
 */
export function buildPipeline(params: {
  id?: string
  name: string
  icon: string
  steps: PipelineStep[]
}): TransformationPipeline {
  return {
    id: params.id || generateId(),
    name: params.name,
    icon: params.icon || '🪄',
    steps: params.steps,
  }
}
