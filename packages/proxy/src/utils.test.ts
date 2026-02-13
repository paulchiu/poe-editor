
import { describe, it, expect } from 'vitest'
import { isDevelopment, isStaticAsset, parsePathMetadata, escapeHtml, getSecret } from './utils'

describe('Utils', () => {
    describe('isDevelopment', () => {
        it('should return false by default', () => {
            expect(isDevelopment({})).toBe(false)
        })

        it('should return true if ENVIRONMENT is development', () => {
             expect(isDevelopment({ ENVIRONMENT: 'development' })).toBe(true)
        })
    })

    describe('isStaticAsset', () => {
        it('should return true for static assets', () => {
            expect(isStaticAsset('/test.js')).toBe(true)
            expect(isStaticAsset('/style.css')).toBe(true)
            expect(isStaticAsset('/image.png')).toBe(true)
            expect(isStaticAsset('/favicon.ico')).toBe(true)
        })

        it('should return false for non-static assets', () => {
            expect(isStaticAsset('/test')).toBe(false)
            expect(isStaticAsset('/api/og')).toBe(false)
        })
    })

    describe('parsePathMetadata', () => {
        it('should parse valid paths', () => {
            expect(parsePathMetadata('/Title/Snippet')).toEqual({ title: 'Title', snippet: 'Snippet' })
        })

        it('should handle URL encoding', () => {
            expect(parsePathMetadata('/Hello%20World/My%20Snippet')).toEqual({ title: 'Hello World', snippet: 'My Snippet' })
        })

        it('should replace hyphens with spaces', () => {
            expect(parsePathMetadata('/Hello-World/My-Snippet')).toEqual({ title: 'Hello World', snippet: 'My Snippet' })
        })

        it('should return null for invalid paths', () => {
            expect(parsePathMetadata('/')).toBeNull()
            expect(parsePathMetadata('/OneSegment')).toBeNull()
            expect(parsePathMetadata('/Too/Many/Segments')).toBeNull()
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

    describe('getSecret', () => {
        it('should return environment secret if present', () => {
            expect(getSecret({ OG_SECRET: 'my-secret' })).toBe('my-secret')
        })

        it('should return default secret if missing', () => {
            expect(getSecret({})).toBe('development-secret')
        })
    })
})
