export type OperationId =
  | 'trim'
  | 'replace'
  | 'change-case'
  | 'sort-lines'
  | 'join-lines'
  | 'split-lines'
  | 'filter-lines'

export type OperationCategory = 'Lines' | 'Text'

export interface FormatterOperation {
  id: OperationId
  name: string
  description: string
  icon: string // Lucide icon name
  category: OperationCategory
  defaultConfig: Record<string, unknown>
}

export interface PipelineStep {
  id: string // unique instance id
  operationId: OperationId
  config: Record<string, unknown> // using unknown instead of any for safety
  enabled: boolean
}

export interface TransformationPipeline {
  id: string
  name: string
  icon: string // Emoji or Lucide icon name
  steps: PipelineStep[]
}
