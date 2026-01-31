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

    case 'dedupe-lines': {
      const caseSensitive = config.caseSensitive !== false
      const keep = (config.keep as string) || 'first'
      const lines = text.split('\n')
      const seen = new Set<string>()

      if (keep === 'first') {
        return lines
          .filter((line) => {
            const key = caseSensitive ? line : line.toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .join('\n')
      } else {
        // Keep last
        const result: string[] = []
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i]
          const key = caseSensitive ? line : line.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            result.unshift(line)
          }
        }
        return result.join('\n')
      }
    }

    case 'reverse-lines': {
      return text.split('\n').reverse().join('\n')
    }

    case 'number-lines': {
      const prefix = String(config.prefix || '')
      const separator = String(config.separator ?? '. ')
      const start = Number(config.start ?? 1)
      return text
        .split('\n')
        .map((line, i) => `${prefix}${start + i}${separator}${line}`)
        .join('\n')
    }

    case 'shuffle-lines': {
      const lines = text.split('\n')
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[lines[i], lines[j]] = [lines[j], lines[i]]
      }
      return lines.join('\n')
    }

    case 'wrap-lines': {
      const prefix = String(config.prefix || '')
      const suffix = String(config.suffix || '')
      return text
        .split('\n')
        .map((line) => prefix + line + suffix)
        .join('\n')
    }

    case 'word-wrap': {
      const width = Number(config.width || 80)
      const lines = text.split('\n')
      const result: string[] = []

      for (const line of lines) {
        if (line.length <= width) {
          result.push(line)
          continue
        }

        let currentLine = line
        while (currentLine.length > width) {
          let splitIndex = currentLine.lastIndexOf(' ', width)
          if (splitIndex === -1) splitIndex = width
          result.push(currentLine.substring(0, splitIndex).trimEnd())
          currentLine = currentLine.substring(splitIndex).trimStart()
        }
        if (currentLine) result.push(currentLine)
      }
      return result.join('\n')
    }

    case 'indent': {
      const mode = config.mode === 'dedent' ? 'dedent' : 'indent'
      const size = Number(config.size || 2)
      const char = config.useTabs ? '\t' : ' '
      const indentStr = char.repeat(config.useTabs ? 1 : size)

      return text
        .split('\n')
        .map((line) => {
          if (mode === 'indent') {
            return indentStr + line
          } else {
            if (line.startsWith(indentStr)) {
              return line.substring(indentStr.length)
            }
            // Fallback for partial dedent
            return line.trimStart().length < line.length
              ? line.replace(new RegExp(`^${char}{1,${size}}`), '')
              : line
          }
        })
        .join('\n')
    }

    case 'extract-matches': {
      const pattern = String(config.pattern || '')
      if (!pattern) return text
      try {
        const flags = `g${config.caseInsensitive ? 'i' : ''}m`
        const regex = new RegExp(pattern, flags)
        const matches = text.match(regex)
        return matches ? matches.join('\n') : ''
      } catch {
        return text
      }
    }

    case 'keep-lines':
    case 'remove-lines': {
      const pattern = String(config.pattern || '')
      if (!pattern) return text
      const isKeep = step.operationId === 'keep-lines'
      const regexMode = !!config.regex
      const caseInsensitive = !!config.caseInsensitive

      return text
        .split('\n')
        .filter((line) => {
          let matches = false
          if (regexMode) {
            try {
              const flags = caseInsensitive ? 'i' : ''
              const regex = new RegExp(pattern, flags)
              matches = regex.test(line)
            } catch {
              matches = false
            }
          } else {
            const l = caseInsensitive ? line.toLowerCase() : line
            const p = caseInsensitive ? pattern.toLowerCase() : pattern
            matches = l.includes(p)
          }
          return isKeep ? matches : !matches
        })
        .join('\n')
    }

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
          return text.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`)
        case 'html-decode': {
          const doc = new DOMParser().parseFromString(text, 'text/html')
          return doc.documentElement.textContent || text
        }
        default:
          return text
      }
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
        const n = parseFloat(num)
        if (isNaN(n)) return num
        return n.toLocaleString(undefined, {
          useGrouping: thousands,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      })
    }

    case 'increment-numbers': {
      const delta = Number(config.delta ?? 1)
      return text.replace(/\d+(?:\.\d+)?/g, (num) => {
        const n = parseFloat(num)
        if (isNaN(n)) return num
        const result = n + delta
        // Preserve decimal count if possible
        const decimalMatch = num.match(/\.(\d+)/)
        if (decimalMatch) {
          return result.toFixed(decimalMatch[1].length)
        }
        return result.toString()
      })
    }

    case 'slugify': {
      const slugifyText = (str: string) =>
        str
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // remove non-word/non-space/non-dash
          .replace(/[\s_-]+/g, '-') // collapse spaces/dashes to single dash
          .replace(/^-+|-+$/g, '') // trim dashes

      if (config.lines) {
        return text.split('\n').map(slugifyText).join('\n')
      }

      return slugifyText(text)
    }

    case 'quote': {
      const mode = (config.mode as string) || 'add'
      const char = String(config.char || '"')

      const quoteText = (str: string) => {
        if (mode === 'add') {
          return char + str + char
        } else {
          if (str.startsWith(char) && str.endsWith(char) && str.length >= char.length * 2) {
            return str.substring(char.length, str.length - char.length)
          }
          return str
        }
      }

      if (config.lines !== false) {
        return text.split('\n').map(quoteText).join('\n')
      }

      return quoteText(text)
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
