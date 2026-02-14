import { describe, it, expect } from 'vitest'
import { parsePathMetadata, escapeHtml } from './utils'

describe('Utils', () => {
  describe('parsePathMetadata', () => {
    it('should parse valid paths', () => {
      expect(parsePathMetadata('/Title/Snippet')).toEqual({ title: 'Title', snippet: 'Snippet' })
    })

    it('should handle URL encoding', () => {
      expect(parsePathMetadata('/Hello%20World/My%20Snippet')).toEqual({
        title: 'Hello World',
        snippet: 'My Snippet',
      })
    })

    it('should replace hyphens with spaces', () => {
      expect(parsePathMetadata('/Hello-World/My-Snippet')).toEqual({
        title: 'Hello World',
        snippet: 'My Snippet',
      })
    })

    it('should return null for invalid paths', () => {
      expect(parsePathMetadata('/')).toBeNull()
      expect(parsePathMetadata('/OneSegment')).toBeNull()
      expect(parsePathMetadata('/Too/Many/Segments')).toBeNull()
    })

    it('should return null for static asset paths', () => {
      expect(parsePathMetadata('/assets/index-vDEImsbE.js')).toBeNull()
      expect(parsePathMetadata('/assets/index-B4kUc-lG.css')).toBeNull()
      expect(parsePathMetadata('/images/logo.png')).toBeNull()
      expect(parsePathMetadata('/favicon.ico')).toBeNull()
      expect(parsePathMetadata('/manifest.json')).toBeNull()
    })
  })

  describe('escapeHtml', () => {
    it('should escape special characters', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
      expect(escapeHtml("'single quoted'")).toBe('&#39;single quoted&#39;')
      expect(escapeHtml('Ampersand & more')).toBe('Ampersand &amp; more')
    })
  })
})
