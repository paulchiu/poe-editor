import { describe, it, expect } from 'vitest'
import { HOME_CONFIG, TWITTER_CONFIG } from './config'
import type { ImageConfig } from './config'

describe('ImageConfig', () => {
  describe('HOME_CONFIG', () => {
    it('should have correct dimensions for Facebook OG image', () => {
      expect(HOME_CONFIG.width).toBe(1200)
      expect(HOME_CONFIG.height).toBe(630)
    })

    it('should have valid title configuration', () => {
      expect(HOME_CONFIG.title.fontSize).toBeGreaterThan(0)
      expect(HOME_CONFIG.title.lineHeight).toBeGreaterThan(0)
    })

    it('should have valid subtitle configuration', () => {
      expect(HOME_CONFIG.subtitle.fontSize).toBeGreaterThan(0)
      expect(HOME_CONFIG.subtitle.marginTop).toBeGreaterThanOrEqual(0)
    })

    it('should have valid divider configuration', () => {
      expect(HOME_CONFIG.divider.width).toBeGreaterThan(0)
      expect(HOME_CONFIG.divider.marginTop).toBeGreaterThanOrEqual(0)
      expect(HOME_CONFIG.divider.marginBottom).toBeGreaterThanOrEqual(0)
    })

    it('should have valid tagline configuration', () => {
      expect(HOME_CONFIG.tagline.fontSize).toBeGreaterThan(0)
    })

    it('should have valid footer configuration', () => {
      expect(HOME_CONFIG.footer.fontSize).toBeGreaterThan(0)
      expect(HOME_CONFIG.footer.bottom).toBeGreaterThanOrEqual(0)
    })

    it('should have valid splash configuration', () => {
      expect(HOME_CONFIG.splash.right).toBeDefined()
      expect(HOME_CONFIG.splash.top).toBeDefined()
      expect(HOME_CONFIG.splash.width).toBeDefined()
      expect(HOME_CONFIG.splash.height).toBeDefined()
      expect(HOME_CONFIG.splash.opacity).toBeGreaterThanOrEqual(0)
      expect(HOME_CONFIG.splash.opacity).toBeLessThanOrEqual(1)
    })
  })

  describe('TWITTER_CONFIG', () => {
    it('should have correct dimensions for Twitter OG image', () => {
      expect(TWITTER_CONFIG.width).toBe(1200)
      expect(TWITTER_CONFIG.height).toBe(1200)
    })

    it('should have larger font sizes than HOME_CONFIG', () => {
      expect(TWITTER_CONFIG.title.fontSize).toBeGreaterThan(HOME_CONFIG.title.fontSize)
      expect(TWITTER_CONFIG.subtitle.fontSize).toBeGreaterThan(HOME_CONFIG.subtitle.fontSize)
      expect(TWITTER_CONFIG.tagline.fontSize).toBeGreaterThan(HOME_CONFIG.tagline.fontSize)
    })

    it('should have valid title configuration', () => {
      expect(TWITTER_CONFIG.title.fontSize).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.title.lineHeight).toBeGreaterThan(0)
    })

    it('should have valid subtitle configuration', () => {
      expect(TWITTER_CONFIG.subtitle.fontSize).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.subtitle.marginTop).toBeGreaterThanOrEqual(0)
    })

    it('should have valid divider configuration', () => {
      expect(TWITTER_CONFIG.divider.width).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.divider.marginTop).toBeGreaterThanOrEqual(0)
      expect(TWITTER_CONFIG.divider.marginBottom).toBeGreaterThanOrEqual(0)
    })

    it('should have valid tagline configuration', () => {
      expect(TWITTER_CONFIG.tagline.fontSize).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.tagline.lineHeight).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.tagline.maxWidth).toBeGreaterThan(0)
    })

    it('should have valid footer configuration', () => {
      expect(TWITTER_CONFIG.footer.fontSize).toBeGreaterThan(0)
      expect(TWITTER_CONFIG.footer.bottom).toBeGreaterThanOrEqual(0)
    })

    it('should have valid splash configuration', () => {
      expect(TWITTER_CONFIG.splash.right).toBeDefined()
      expect(TWITTER_CONFIG.splash.top).toBeDefined()
      expect(TWITTER_CONFIG.splash.width).toBeDefined()
      expect(TWITTER_CONFIG.splash.height).toBeDefined()
      expect(TWITTER_CONFIG.splash.opacity).toBeGreaterThanOrEqual(0)
      expect(TWITTER_CONFIG.splash.opacity).toBeLessThanOrEqual(1)
    })

    it('should have lower splash opacity than HOME_CONFIG', () => {
      expect(TWITTER_CONFIG.splash.opacity).toBeLessThan(HOME_CONFIG.splash.opacity)
    })
  })

  describe('config type safety', () => {
    it('should match ImageConfig interface', () => {
      const validateConfig = (config: ImageConfig): boolean => {
        return (
          typeof config.width === 'number' &&
          typeof config.height === 'number' &&
          typeof config.title.fontSize === 'number' &&
          typeof config.title.lineHeight === 'number' &&
          typeof config.subtitle.fontSize === 'number' &&
          typeof config.subtitle.marginTop === 'number' &&
          typeof config.divider.width === 'number' &&
          typeof config.divider.marginTop === 'number' &&
          typeof config.divider.marginBottom === 'number' &&
          typeof config.tagline.fontSize === 'number' &&
          typeof config.footer.fontSize === 'number' &&
          typeof config.footer.bottom === 'number' &&
          typeof config.splash.right === 'string' &&
          typeof config.splash.top === 'string' &&
          typeof config.splash.width === 'string' &&
          typeof config.splash.height === 'string' &&
          typeof config.splash.opacity === 'number'
        )
      }

      expect(validateConfig(HOME_CONFIG)).toBe(true)
      expect(validateConfig(TWITTER_CONFIG)).toBe(true)
    })
  })
})
