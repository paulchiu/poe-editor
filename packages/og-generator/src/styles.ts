/**
 * Shared style constants for OG image generation
 */

export const COLORS = {
  background: '#050508',
  white: 'white',
  subtitle: '#d1d5db',
  tagline: 'rgba(155, 35, 53, 0.75)',
  accent: '#9B2335',
  footer: '#6b7280',
} as const

export const GRADIENTS = {
  background: 'linear-gradient(to bottom right, #1a1610, #0c0a08, #000000)',
} as const

export const BASE_STYLES = {
  container: {
    display: 'flex',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    color: COLORS.white,
    fontFamily: '"Playfair Display"',
  },
  backgroundGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: GRADIENTS.background,
  },
  contentContainer: {
    position: 'relative' as const,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    paddingLeft: '96px',
    maxWidth: '800px',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  borderOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
} as const
