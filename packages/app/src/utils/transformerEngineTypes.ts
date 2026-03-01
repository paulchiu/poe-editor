import type { OperationId, PipelineStep } from '@/components/transformer/types'

/**
 * Machine-readable issue code emitted during non-fatal transformer execution.
 */
export type TransformationIssueCode = 'invalid-json-input' | 'invalid-json-line'

/**
 * Describes a non-fatal problem encountered while applying a pipeline step.
 */
export interface TransformationIssue {
  stepId: string
  operationId: OperationId
  code: TransformationIssueCode
  message: string
  line?: number
}

/**
 * Result object returned by pipeline execution with output and collected issues.
 */
export interface PipelineExecutionResult {
  output: string
  issues: TransformationIssue[]
}

/**
 * Mutable execution context shared across step handlers.
 */
export interface ApplyStepContext {
  issues: TransformationIssue[]
}

/**
 * Internal step handler function signature.
 */
export type StepOperationHandler = (
  text: string,
  step: PipelineStep,
  context: ApplyStepContext
) => string | null
