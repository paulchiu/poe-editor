import { describe, it, expect } from 'vitest'
import { cn } from './classnames'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3')
  })

  it('should handle undefined and null inputs', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
  })
})
