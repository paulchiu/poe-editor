import { describe, it, expect } from 'vitest'
import { neofetch } from './neofetch'

describe('neofetch', () => {
  it('returns a non-empty string', () => {
    const result = neofetch()
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains "edgar@poe-editor"', () => {
    const result = neofetch()
    expect(result).toContain('edgar@poe-editor')
  })

  it('contains expected system info fields', () => {
    const result = neofetch()
    const fields = ['OS:', 'Host:', 'Kernel:', 'Shell:', 'Editor:', 'Theme:', 'Uptime:', 'Packages:', 'Memory:']
    for (const field of fields) {
      expect(result).toContain(field)
    }
  })

  it('contains ANSI escape codes', () => {
    const result = neofetch()
    expect(result).toContain('\x1b[')
  })
})
