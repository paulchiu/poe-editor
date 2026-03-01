import type { PipelineStep } from '@/components/transformer/types'
import type { ApplyStepContext } from '@/utils/transformerEngineTypes'

/**
 * Determines whether a parsed JSON value is a plain object.
 * @param value - Parsed JSON value.
 * @returns True when value is a non-null object and not an array.
 */
function isJsonObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Applies data-oriented transformer operations.
 * @param text - Input text.
 * @param step - Pipeline step being executed.
 * @param context - Shared execution context for collecting issues.
 * @returns Transformed text for handled operations, otherwise `null`.
 */
export function applyDataOperationStep(
  text: string,
  step: PipelineStep,
  context: ApplyStepContext
): string | null {
  const { config } = step

  switch (step.operationId) {
    case 'remove-chars': {
      const mode = (config.mode as string) || 'digits'
      const custom = String(config.custom || '')
      let regex: RegExp

      switch (mode) {
        case 'digits':
          regex = /\d/g
          break
        case 'punctuation':
          regex = /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/g
          break
        case 'non-ascii':
          // eslint-disable-next-line no-control-regex
          regex = /[^\x00-\x7F]/g
          break
        case 'custom':
          regex = new RegExp(`[${custom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g')
          break
        default:
          return text
      }

      return text.replace(regex, '')
    }

    case 'encode-decode': {
      const mode = (config.mode as string) || 'url-encode'

      switch (mode) {
        case 'url-encode':
          return encodeURIComponent(text)
        case 'url-decode':
          try {
            return decodeURIComponent(text)
          } catch {
            return text
          }
        case 'base64-encode':
          return btoa(text)
        case 'base64-decode':
          try {
            return atob(text)
          } catch {
            return text
          }
        case 'html-encode':
          return text.replace(/[\u00A0-\u9999<>&]/g, (char) => `&#${char.charCodeAt(0)};`)
        case 'html-decode': {
          const doc = new DOMParser().parseFromString(text, 'text/html')
          return doc.documentElement.textContent || text
        }
        default:
          return text
      }
    }

    case 'format-json': {
      if (config.lines === true) {
        return text
          .split('\n')
          .map((line, index) => {
            if (!line.trim()) {
              return line
            }

            try {
              const parsed: unknown = JSON.parse(line)
              if (!isJsonObject(parsed)) {
                throw new Error('Line is not a JSON object')
              }
              return JSON.stringify(parsed, null, 2)
            } catch {
              context.issues.push({
                stepId: step.id,
                operationId: 'format-json',
                code: 'invalid-json-line',
                message: `Line ${index + 1} is not a valid JSON object`,
                line: index + 1,
              })
              return line
            }
          })
          .join('\n')
      }

      try {
        const parsed: unknown = JSON.parse(text)
        return JSON.stringify(parsed, null, 2)
      } catch {
        context.issues.push({
          stepId: step.id,
          operationId: 'format-json',
          code: 'invalid-json-input',
          message: 'Input is not valid JSON',
        })
        return text
      }
    }

    case 'strip-html': {
      const doc = new DOMParser().parseFromString(text, 'text/html')
      doc.querySelectorAll('script, style').forEach((element) => element.remove())
      return doc.body.textContent || ''
    }

    case 'escape': {
      const mode = (config.mode as string) || 'json-escape'

      switch (mode) {
        case 'json-escape':
          return JSON.stringify(text).slice(1, -1)
        case 'json-unescape':
          try {
            return JSON.parse(`"${text}"`)
          } catch {
            return text
          }
        case 'regex-escape':
          return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        default:
          return text
      }
    }

    case 'pad-align': {
      const width = Number(config.width || 20)
      const align = (config.align as string) || 'left'
      const char = String(config.char || ' ')

      return text
        .split('\n')
        .map((line) => {
          if (line.length >= width) return line

          const diff = width - line.length
          if (align === 'left') return line + char.repeat(diff)
          if (align === 'right') return char.repeat(diff) + line

          const left = Math.floor(diff / 2)
          const right = diff - left
          return char.repeat(left) + line + char.repeat(right)
        })
        .join('\n')
    }

    case 'format-numbers': {
      const thousands = config.thousands !== false
      const decimals = Number(config.decimals ?? 2)
      return text.replace(/\d+(?:\.\d+)?/g, (num) => {
        const parsed = parseFloat(num)
        if (isNaN(parsed)) return num

        return parsed.toLocaleString(undefined, {
          useGrouping: thousands,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      })
    }

    case 'increment-numbers': {
      const delta = Number(config.delta ?? 1)
      return text.replace(/\d+(?:\.\d+)?/g, (num) => {
        const parsed = parseFloat(num)
        if (isNaN(parsed)) return num

        const result = parsed + delta
        const decimalMatch = num.match(/\.(\d+)/)
        if (decimalMatch) {
          return result.toFixed(decimalMatch[1].length)
        }
        return result.toString()
      })
    }

    default:
      return null
  }
}
