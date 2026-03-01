import type { PipelineStep } from '@/components/transformer/types'
import type { ApplyStepContext } from '@/utils/transformerEngineTypes'
import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from '@/utils/transformerEngineCaseUtils'

function applyCaseByMode(value: string, mode: string): string {
  switch (mode) {
    case 'upper':
      return value.toUpperCase()
    case 'lower':
      return value.toLowerCase()
    case 'title':
      return value.replace(
        /\w\S*/g,
        (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
      )
    case 'camel':
      return toCamelCase(value)
    case 'snake':
      return toSnakeCase(value)
    case 'kebab':
      return toKebabCase(value)
    case 'pascal':
      return toPascalCase(value)
    case 'constant':
      return toConstantCase(value)
    default:
      return value
  }
}

/**
 * Applies text-format transformer operations.
 * @param text - Input text.
 * @param step - Pipeline step being executed.
 * @returns Transformed text for handled operations, otherwise `null`.
 */
export function applyTextOperationStep(
  text: string,
  step: PipelineStep,
  _context: ApplyStepContext
): string | null {
  const { config } = step

  switch (step.operationId) {
    case 'change-case': {
      const mode = config.mode as string
      const applyPerLine = config.lines !== false

      if (applyPerLine) {
        return text
          .split('\n')
          .map((line) => applyCaseByMode(line, mode))
          .join('\n')
      }

      return applyCaseByMode(text, mode)
    }

    case 'slugify': {
      const slugifyText = (value: string): string =>
        value
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')

      if (config.lines) {
        return text.split('\n').map(slugifyText).join('\n')
      }

      return slugifyText(text)
    }

    case 'quote': {
      const mode = (config.mode as string) || 'add'
      const char = String(config.char || '"')

      const quoteText = (value: string): string => {
        if (mode === 'add') {
          return char + value + char
        }

        if (value.startsWith(char) && value.endsWith(char) && value.length >= char.length * 2) {
          return value.substring(char.length, value.length - char.length)
        }

        return value
      }

      if (config.lines !== false) {
        return text.split('\n').map(quoteText).join('\n')
      }

      return quoteText(text)
    }

    default:
      return null
  }
}
