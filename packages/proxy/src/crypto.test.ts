import { describe, it, expect } from 'vitest'
import { generateSignature, verifySignature } from './crypto'

describe('Crypto', () => {
  const secret = 'test-secret'

  describe('generateSignature', () => {
    it('should generate a signature', async () => {
      const signature = await generateSignature('Title', 'Snippet', null, secret)
      expect(signature).toBeDefined()
      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })

    it('should generate different signatures for different inputs', async () => {
      const sig1 = await generateSignature('Title1', 'Snippet', null, secret)
      const sig2 = await generateSignature('Title2', 'Snippet', null, secret)
      expect(sig1).not.toBe(sig2)
    })

    it('should include platform in signature', async () => {
      const sig1 = await generateSignature('Title', 'Snippet', null, secret)
      const sig2 = await generateSignature('Title', 'Snippet', 'twitter', secret)
      expect(sig1).not.toBe(sig2)
    })
  })

  describe('verifySignature', () => {
    it('should return true for valid signature', async () => {
      const signature = await generateSignature('Title', 'Snippet', null, secret)
      const isValid = await verifySignature('Title', 'Snippet', null, signature, secret)
      expect(isValid).toBe(true)
    })

    it('should return false for invalid signature', async () => {
      const signature = await generateSignature('Title', 'Snippet', null, secret)
      const isValid = await verifySignature('Title', 'Snippet', null, 'invalid', secret)
      expect(isValid).toBe(false)
    })

    it('should return false if parameters mismatch', async () => {
      const signature = await generateSignature('Title', 'Snippet', null, secret)
      const isValid = await verifySignature('Title', 'Different', null, signature, secret)
      expect(isValid).toBe(false)
    })

    it('should return false if secret is different', async () => {
      const signature = await generateSignature('Title', 'Snippet', null, secret)
      const isValid = await verifySignature('Title', 'Snippet', null, signature, 'wrong-secret')
      expect(isValid).toBe(false)
    })
  })
})
