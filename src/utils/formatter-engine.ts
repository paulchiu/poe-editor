import type { TransformationPipeline, PipelineStep } from '@/components/formatter/types'

/**
 * Applies a single transformation step to the text.
 * @param text - The input text.
 * @param step - The pipeline step to apply.
 * @returns The transformed text.
 */
function applyStep(text: string, step: PipelineStep): string {
  if (!step.enabled) return text

  const { config } = step
  
  switch (step.operationId) {
    case 'trim':
      return text.trim()
    
    case 'replace': {
      const from = String(config.from || '')
      const to = String(config.to || '')
      if (!from) return text
      // Simple global replace
      return text.split(from).join(to)
    }

    case 'change-case': {
      const mode = config.mode as string
      switch (mode) {
        case 'upper':
          return text.toUpperCase()
        case 'lower':
          return text.toLowerCase()
        case 'title':
          return text.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
          )
        default:
          return text
      }
    }

    case 'sort-lines': {
      const direction = config.direction === 'desc' ? 'desc' : 'asc'
      const numeric = !!config.numeric
      const lines = text.split('\n')
      
      lines.sort((a, b) => {
        if (numeric) {
          const numA = parseFloat(a) || 0
          const numB = parseFloat(b) || 0
          return direction === 'asc' ? numA - numB : numB - numA
        }
        return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      })
      
      return lines.join('\n')
    }
    
    case 'join-lines': {
      const separator = String(config.separator ?? ' ')
      return text.split('\n').join(separator)
    }

    case 'split-lines': {
      const separator = String(config.separator || ',')
      return text.split(separator).join('\n')
    }

    default:
      return text
  }
}

/**
 * Applies a transformation pipeline to the input text.
 * @param text - The input text to transform.
 * @param pipeline - The pipeline configuration containing steps.
 * @returns The transformed text.
 */
export function applyPipeline(text: string, pipeline: TransformationPipeline): string {
  return pipeline.steps.reduce((currentText, step) => {
    return applyStep(currentText, step)
  }, text)
}
