import { describe, it, expect } from 'vitest'
import { countWords } from './countWords'

describe('countWords', () => {
  it('counts words separated by whitespace', () => {
    expect(countWords('hello world')).toBe(2)
    expect(countWords('one\ntwo\tthree')).toBe(3)
  })

  it('handles extra whitespace', () => {
    expect(countWords('   hello   world   ')).toBe(2)
  })

  it('returns zero for empty content', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })
})
