import type {
  OperationId,
  PipelineStep,
  TransformationPipeline,
} from '@/components/transformer/types'
import type { ApplyStepContext } from '@/utils/transformerEngineTypes'

/**
 * Builds a pipeline step for transformer tests.
 * @param operationId - Operation identifier under test.
 * @param config - Step configuration payload.
 * @param enabled - Whether the step is enabled.
 * @param id - Optional explicit step id.
 * @returns A pipeline step object.
 */
export function createStep(
  operationId: OperationId,
  config: Record<string, unknown> = {},
  enabled = true,
  id = 'step-1'
): PipelineStep {
  return {
    id,
    operationId,
    config,
    enabled,
  }
}

/**
 * Builds a transformation pipeline for tests.
 * @param steps - Pipeline steps.
 * @returns A pipeline object.
 */
export function createPipeline(steps: PipelineStep[]): TransformationPipeline {
  return {
    id: 'test',
    name: 'Test Pipeline',
    icon: 'wand',
    steps,
  }
}

/**
 * Builds mutable step context for issue collection.
 * @returns An empty apply-step context.
 */
export function createContext(): ApplyStepContext {
  return { issues: [] }
}
