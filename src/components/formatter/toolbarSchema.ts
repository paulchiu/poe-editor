import { z } from 'zod'
import type { TransformationPipeline } from './types'

/**
 * Zod schema for a single pipeline step.
 */
const PipelineStepSchema = z.object({
  id: z.string(),
  operationId: z.enum(['trim', 'replace', 'change-case', 'sort-lines', 'join-lines', 'split-lines']),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean(),
})

/**
 * Zod schema for a transformation pipeline.
 */
const TransformationPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  steps: z.array(PipelineStepSchema),
})

/**
 * Schema version for future migration support.
 */
export const SCHEMA_VERSION = 1

/**
 * Zod schema for the entire toolbar export.
 */
export const ToolbarExportSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  pipelines: z.array(TransformationPipelineSchema),
})

export type ToolbarExport = z.infer<typeof ToolbarExportSchema>

/**
 * Creates a versioned export object from pipelines.
 * @param pipelines - The pipelines to export
 * @returns A versioned export object
 */
export function createToolbarExport(pipelines: TransformationPipeline[]): ToolbarExport {
  return {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pipelines,
  }
}

/**
 * Parses and validates a toolbar import JSON string.
 * @param json - The JSON string to parse
 * @returns The validated pipelines
 * @throws Error if validation fails
 */
export function parseToolbarImport(json: string): TransformationPipeline[] {
  try {
    const raw = JSON.parse(json)
    const validated = ToolbarExportSchema.parse(raw)
    return validated.pipelines
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid configuration format: ${error.issues.map((issue: z.ZodIssue) => issue.message).join(', ')}`)
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format')
    }
    throw error
  }
}
