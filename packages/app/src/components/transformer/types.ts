export type OperationId =
  | 'trim'
  | 'replace'
  | 'change-case'
  | 'sort-lines'
  | 'join-lines'
  | 'split-lines'
  | 'filter-lines'
  // Phase 1
  | 'dedupe-lines'
  | 'reverse-lines'
  | 'number-lines'
  | 'shuffle-lines'
  // Phase 2
  | 'wrap-lines'
  | 'word-wrap'
  | 'indent'
  // Phase 3
  | 'extract-matches'
  | 'keep-lines'
  | 'remove-lines'
  // Phase 4
  | 'remove-chars'
  | 'encode-decode'
  | 'escape'
  // Phase 5
  | 'pad-align'
  | 'format-numbers'
  | 'increment-numbers'
  // Phase 6
  | 'slugify'
  | 'quote'

export type OperationCategory = 'Text' | 'Lines' | 'Structure' | 'Search' | 'Data'

export interface TransformerOperation {
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

export interface DragData {
  sortable?: { index: number }
  operation?: TransformerOperation
}
