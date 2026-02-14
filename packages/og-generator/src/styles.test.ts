import { describe, it, expect } from 'vitest'
import { COLORS, GRADIENTS, BASE_STYLES } from './styles'

describe('COLORS', () => {
  it('should define all required color constants', () => {
    expect(COLORS.background).toBeDefined()
    expect(COLORS.white).toBeDefined()
    expect(COLORS.subtitle).toBeDefined()
    expect(COLORS.tagline).toBeDefined()
    expect(COLORS.accent).toBeDefined()
    expect(COLORS.footer).toBeDefined()
  })

  it('should have valid color values', () => {
    // Check hex colors
    expect(COLORS.background).toMatch(/^#[0-9a-f]{6}$/i)
    expect(COLORS.subtitle).toMatch(/^#[0-9a-f]{6}$/i)
    expect(COLORS.accent).toMatch(/^#[0-9a-f]{6}$/i)
    expect(COLORS.footer).toMatch(/^#[0-9a-f]{6}$/i)

    // Check named color
    expect(COLORS.white).toBe('white')

    // Check rgba color
    expect(COLORS.tagline).toMatch(/^rgba\(/)
  })
})

describe('GRADIENTS', () => {
  it('should define background gradient', () => {
    expect(GRADIENTS.background).toBeDefined()
    expect(GRADIENTS.background).toContain('linear-gradient')
  })
})

describe('BASE_STYLES', () => {
  describe('container', () => {
    it('should have required layout properties', () => {
      expect(BASE_STYLES.container.display).toBe('flex')
      expect(BASE_STYLES.container.position).toBe('relative')
      expect(BASE_STYLES.container.overflow).toBe('hidden')
    })

    it('should have color properties', () => {
      expect(BASE_STYLES.container.backgroundColor).toBe(COLORS.background)
      expect(BASE_STYLES.container.color).toBe(COLORS.white)
    })

    it('should have font family', () => {
      expect(BASE_STYLES.container.fontFamily).toBeDefined()
      expect(BASE_STYLES.container.fontFamily).toContain('Playfair Display')
    })
  })

  describe('backgroundGradient', () => {
    it('should be absolutely positioned', () => {
      expect(BASE_STYLES.backgroundGradient.position).toBe('absolute')
      expect(BASE_STYLES.backgroundGradient.top).toBe(0)
      expect(BASE_STYLES.backgroundGradient.left).toBe(0)
      expect(BASE_STYLES.backgroundGradient.right).toBe(0)
      expect(BASE_STYLES.backgroundGradient.bottom).toBe(0)
    })

    it('should use gradient from GRADIENTS', () => {
      expect(BASE_STYLES.backgroundGradient.backgroundImage).toBe(GRADIENTS.background)
    })
  })

  describe('contentContainer', () => {
    it('should have flex layout', () => {
      expect(BASE_STYLES.contentContainer.display).toBe('flex')
      expect(BASE_STYLES.contentContainer.flexDirection).toBe('column')
      expect(BASE_STYLES.contentContainer.justifyContent).toBe('center')
    })

    it('should be relatively positioned', () => {
      expect(BASE_STYLES.contentContainer.position).toBe('relative')
      expect(BASE_STYLES.contentContainer.height).toBe('100%')
    })

    it('should have padding and max width', () => {
      expect(BASE_STYLES.contentContainer.paddingLeft).toBeDefined()
      expect(BASE_STYLES.contentContainer.maxWidth).toBeDefined()
    })
  })

  describe('titleBlock', () => {
    it('should have flex layout', () => {
      expect(BASE_STYLES.titleBlock.display).toBe('flex')
      expect(BASE_STYLES.titleBlock.flexDirection).toBe('column')
      expect(BASE_STYLES.titleBlock.alignItems).toBe('flex-start')
    })
  })

  describe('borderOverlay', () => {
    it('should be absolutely positioned', () => {
      expect(BASE_STYLES.borderOverlay.position).toBe('absolute')
      expect(BASE_STYLES.borderOverlay.top).toBe(0)
      expect(BASE_STYLES.borderOverlay.left).toBe(0)
      expect(BASE_STYLES.borderOverlay.right).toBe(0)
      expect(BASE_STYLES.borderOverlay.bottom).toBe(0)
    })

    it('should have border', () => {
      expect(BASE_STYLES.borderOverlay.border).toBeDefined()
      expect(BASE_STYLES.borderOverlay.border).toContain('rgba')
    })
  })
})
