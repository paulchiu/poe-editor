import type { TransformationPipeline } from '@/components/transformer/types'
import { applyStep } from '@/utils/transformerEngineApplyStep'
import type { PipelineExecutionResult, TransformationIssue } from '@/utils/transformerEngineTypes'

export type { TransformationIssueCode } from '@/utils/transformerEngineTypes'
export type { TransformationIssue, PipelineExecutionResult } from '@/utils/transformerEngineTypes'

/**
 * Applies a transformation pipeline to the input text.
 * @param text - The input text to transform.
 * @param pipeline - The pipeline configuration containing steps.
 * @returns The transformed text and collected non-fatal transformation issues.
 */
export function applyPipelineWithIssues(
  text: string,
  pipeline: TransformationPipeline
): PipelineExecutionResult {
  const issues: TransformationIssue[] = []
  const output = pipeline.steps.reduce((currentText, step) => {
    return applyStep(currentText, step, { issues })
  }, text)

  return { output, issues }
}

/**
 * Builds a user-facing summary for known pipeline issues.
 * @param issues - Transformation issues from pipeline execution.
 * @returns A short summary string, or null when there are no issues.
 */
export function getPipelineIssueSummary(issues: TransformationIssue[]): string | null {
  if (issues.length === 0) return null

  const invalidLineCount = issues.filter((issue) => issue.code === 'invalid-json-line').length
  const hasInvalidInput = issues.some((issue) => issue.code === 'invalid-json-input')

  if (invalidLineCount > 0 && hasInvalidInput) {
    return `Format JSON skipped ${invalidLineCount} invalid line${invalidLineCount === 1 ? '' : 's'} and found invalid JSON input`
  }

  if (invalidLineCount > 0) {
    return `Format JSON skipped ${invalidLineCount} invalid line${invalidLineCount === 1 ? '' : 's'}`
  }

  if (hasInvalidInput) {
    return 'Format JSON requires valid JSON input'
  }

  return issues[0]?.message ?? null
}

/**
 * Applies a transformation pipeline to the input text.
 * @param text - The input text to transform.
 * @param pipeline - The pipeline configuration containing steps.
 * @returns The transformed text.
 */
export function applyPipeline(text: string, pipeline: TransformationPipeline): string {
  return applyPipelineWithIssues(text, pipeline).output
}
