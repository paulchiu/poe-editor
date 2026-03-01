import type { PipelineStep } from '@/components/transformer/types'
import type { ApplyStepContext } from '@/utils/transformerEngineTypes'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyReplace(text: string, config: Record<string, unknown>): string {
  const from = String(config.from || '')
  const to = String(config.to || '')
  if (!from) return text

  const replaceText = (value: string): string => {
    if (config.regex) {
      try {
        const flags = `g${config.caseInsensitive ? 'i' : ''}`
        const regex = new RegExp(from, flags)
        return value.replace(regex, to)
      } catch {
        return value
      }
    }

    if (config.caseInsensitive) {
      const regex = new RegExp(escapeRegExp(from), 'gi')
      return value.replace(regex, to)
    }

    return value.split(from).join(to)
  }

  if (config.lines) {
    return text.split('\n').map(replaceText).join('\n')
  }

  return replaceText(text)
}

function applyIndent(text: string, config: Record<string, unknown>): string {
  const mode = config.mode === 'dedent' ? 'dedent' : 'indent'
  const size = Number(config.size || 2)
  const char = config.useTabs ? '\t' : ' '
  const indentStr = char.repeat(config.useTabs ? 1 : size)

  return text
    .split('\n')
    .map((line) => {
      if (mode === 'indent') {
        return indentStr + line
      }

      if (line.startsWith(indentStr)) {
        return line.substring(indentStr.length)
      }

      const hasLeadingWhitespace = line.trimStart().length < line.length
      if (!hasLeadingWhitespace) {
        return line
      }

      const escapedChar = escapeRegExp(char)
      return line.replace(new RegExp(`^${escapedChar}{1,${size}}`), '')
    })
    .join('\n')
}

function applyKeepRemoveLines(text: string, step: PipelineStep): string {
  const pattern = String(step.config.pattern || '')
  if (!pattern) return text

  const isKeep = step.operationId === 'keep-lines'
  const regexMode = !!step.config.regex
  const caseInsensitive = !!step.config.caseInsensitive

  return text
    .split('\n')
    .filter((line) => {
      let matches = false

      if (regexMode) {
        try {
          const regex = new RegExp(pattern, caseInsensitive ? 'i' : '')
          matches = regex.test(line)
        } catch {
          matches = false
        }
      } else {
        const normalizedLine = caseInsensitive ? line.toLowerCase() : line
        const normalizedPattern = caseInsensitive ? pattern.toLowerCase() : pattern
        matches = normalizedLine.includes(normalizedPattern)
      }

      return isKeep ? matches : !matches
    })
    .join('\n')
}

/**
 * Applies line-oriented transformer operations.
 * @param text - Input text.
 * @param step - Pipeline step being executed.
 * @returns Transformed text for handled operations, otherwise `null`.
 */
export function applyLineOperationStep(
  text: string,
  step: PipelineStep,
  _context: ApplyStepContext
): string | null {
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
        .filter((line) => (trim ? line.trim().length > 0 : line.length > 0))
        .join('\n')
    }

    case 'replace':
      return applyReplace(text, config)

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
      }

      const result: string[] = []
      for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index]
        const key = caseSensitive ? line : line.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          result.unshift(line)
        }
      }

      return result.join('\n')
    }

    case 'reverse-lines':
      return text.split('\n').reverse().join('\n')

    case 'number-lines': {
      const prefix = String(config.prefix || '')
      const separator = String(config.separator ?? '. ')
      const start = Number(config.start ?? 1)
      return text
        .split('\n')
        .map((line, index) => `${prefix}${start + index}${separator}${line}`)
        .join('\n')
    }

    case 'shuffle-lines': {
      const lines = text.split('\n')
      for (let index = lines.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[lines[index], lines[swapIndex]] = [lines[swapIndex], lines[index]]
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

        if (currentLine) {
          result.push(currentLine)
        }
      }

      return result.join('\n')
    }

    case 'indent':
      return applyIndent(text, config)

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
    case 'remove-lines':
      return applyKeepRemoveLines(text, step)

    default:
      return null
  }
}
