import type { PipelineStep } from '@/components/transformer/types'
import { applyDataOperationStep } from '@/utils/transformerEngineDataOperations'
import { applyLineOperationStep } from '@/utils/transformerEngineLineOperations'
import { applyTextOperationStep } from '@/utils/transformerEngineTextOperations'
import type { ApplyStepContext } from '@/utils/transformerEngineTypes'

/**
 * Applies one enabled pipeline step to the provided text.
 * @param text - Input text.
 * @param step - Pipeline step to execute.
 * @param context - Shared execution context for issue collection.
 * @returns Transformed text for this step.
 */
export function applyStep(text: string, step: PipelineStep, context: ApplyStepContext): string {
  if (!step.enabled) {
    return text
  }

  const lineResult = applyLineOperationStep(text, step, context)
  if (lineResult !== null) {
    return lineResult
  }

  const textResult = applyTextOperationStep(text, step, context)
  if (textResult !== null) {
    return textResult
  }

  const dataResult = applyDataOperationStep(text, step, context)
  if (dataResult !== null) {
    return dataResult
  }

  return text
}
