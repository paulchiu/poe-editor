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
      if (config.lines) {
        return text
          .split('\n')
          .map((line) => line.trim())
          .join('\n')
      }
      return text.trim()

    case 'filter-lines': {
      const trim = !!config.trim
      return text
        .split('\n')
        .filter((line) => {
          if (trim) return line.trim().length > 0
          return line.length > 0
        })
        .join('\n')
    }

    case 'replace': {
      const from = String(config.from || '')
      const to = String(config.to || '')
      if (!from) return text

      const replaceText = (str: string) => {
        if (config.regex) {
          try {
            const flags = `g${config.caseInsensitive ? 'i' : ''}`
            const regex = new RegExp(from, flags)
            return str.replace(regex, to)
          } catch {
            // Invalid regex - return original string unchanged
            return str
          }
        }

        if (config.caseInsensitive) {
          const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escaped, 'gi')
          return str.replace(regex, to)
        }

        return str.split(from).join(to)
      }

      if (config.lines) {
        return text.split('\n').map(replaceText).join('\n')
      }

      return replaceText(text)
    }

    case 'change-case': {
      const mode = config.mode as string
      const lines = config.lines !== false // Default to true

      const applyCase = (str: string) => {
        switch (mode) {
          case 'upper':
            return str.toUpperCase()
          case 'lower':
            return str.toLowerCase()
          case 'title':
            return str.replace(
              /\w\S*/g,
              (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
            )
          case 'camel':
            return toCamelCase(str)
          case 'snake':
            return toSnakeCase(str)
          case 'kebab':
            return toKebabCase(str)
          case 'pascal':
            return toPascalCase(str)
          case 'constant':
            return toConstantCase(str)
          default:
            return str
        }
      }

      if (lines) {
        return text.split('\n').map(applyCase).join('\n')
      }

      return applyCase(text)
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

// Helper functions for case conversion
function toCamelCase(str: string): string {
  // Simple implementation: split by non-alphanumeric, then map
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[-_]+/g, '') // remove separators if any remaining
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function toPascalCase(str: string): string {
  return str
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(/\s+(.)(\w*)/g, ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`)
    .replace(new RegExp(/\w/), (s) => s.toUpperCase())
}

function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase()
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
