import { describe, it, expect } from 'vitest'
import {
  compressToHash,
  decompressFromHash,
  compressDocumentToHash,
  decompressDocumentFromHash,
} from './compression'

describe('compression', () => {
  describe('compressToHash & decompressFromHash', () => {
    it('should compress and decompress a string', () => {
      const text = 'Hello, world!'
      const hash = compressToHash(text)
      const decompressed = decompressFromHash(hash)
      expect(decompressed).toBe(text)
    })

    it('should handle empty string', () => {
      const hash = compressToHash('')
      expect(hash).toBe('')
      const decompressed = decompressFromHash('')
      expect(decompressed).toBe('')
    })

    it('should return null for invalid hash', () => {
      expect(decompressFromHash('invalid-hash')).toBe(null)
    })
  })

  describe('compressDocumentToHash & decompressDocumentFromHash', () => {
    it('should compress and decompress document data with name', () => {
      const data = { content: '# Hello', name: 'test.md' }
      const hash = compressDocumentToHash(data)
      const decompressed = decompressDocumentFromHash(hash)
      expect(decompressed).toEqual(data)
    })

    it('should compress and decompress document data without name', () => {
      const data = { content: '# Hello' }
      const hash = compressDocumentToHash(data)
      const decompressed = decompressDocumentFromHash(hash)
      expect(decompressed).toEqual({ ...data, name: undefined })
    })

    it('should handle legacy format (plain content)', () => {
      const content = '# Legacy content'
      const hash = compressToHash(content) // Compressed as plain string, not JSON
      const decompressed = decompressDocumentFromHash(hash)
      expect(decompressed).toEqual({ content })
    })

    it('should return null for completely invalid hash', () => {
      expect(decompressDocumentFromHash('invalid-hash')).toBe(null)
    })

    it('should handle empty hash', () => {
      expect(decompressDocumentFromHash('')).toEqual({ content: '' })
    })
  })
})
