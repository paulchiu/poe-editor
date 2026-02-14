import React from 'react'
import type { ImageConfig } from './config'
import { BASE_STYLES, COLORS } from './styles'

interface OgImageProps {
  splashSrc: string
  config: ImageConfig
}

/**
 * Unified OG image component that renders based on configuration
 * @param splashSrc - Base64 or URL of the splash image
 * @param config - Image configuration (dimensions, typography, positioning)
 * @returns React element for OG image
 */
export const OgImage = ({ splashSrc, config }: OgImageProps) => (
  <div
    style={{ ...BASE_STYLES.container, width: `${config.width}px`, height: `${config.height}px` }}
  >
    <div style={BASE_STYLES.backgroundGradient} />

    <img
      src={splashSrc}
      style={{
        position: 'absolute',
        right: config.splash.right,
        top: config.splash.top,
        width: config.splash.width,
        height: config.splash.height,
        opacity: config.splash.opacity,
      }}
    />

    <div style={BASE_STYLES.contentContainer}>
      <div style={BASE_STYLES.titleBlock}>
        <h1
          style={{
            fontSize: `${config.title.fontSize}px`,
            lineHeight: config.title.lineHeight,
            fontWeight: 900,
            color: COLORS.white,
            margin: 0,
          }}
        >
          Poe
        </h1>
        <h2
          style={{
            fontSize: `${config.subtitle.fontSize}px`,
            fontWeight: 300,
            color: COLORS.subtitle,
            marginTop: `${config.subtitle.marginTop}px`,
            letterSpacing: '0.025em',
            margin: `${config.subtitle.marginTop}px 0 0 0`,
          }}
        >
          Markdown Editor
        </h2>
      </div>

      <div
        style={{
          height: '2px',
          width: `${config.divider.width}px`,
          backgroundColor: COLORS.accent,
          marginTop: `${config.divider.marginTop}px`,
          marginBottom: `${config.divider.marginBottom}px`,
          boxShadow: '0 0 10px rgba(155,35,53,0.45)',
        }}
      />

      <p
        style={{
          fontSize: `${config.tagline.fontSize}px`,
          color: COLORS.tagline,
          fontWeight: 300,
          letterSpacing: '0.025em',
          ...(config.tagline.lineHeight ? { lineHeight: config.tagline.lineHeight } : {}),
          ...(config.tagline.maxWidth ? { maxWidth: `${config.tagline.maxWidth}px` } : {}),
          margin: 0,
        }}
      >
        Modal editing for Markdown
      </p>

      <div
        style={{
          position: 'absolute',
          bottom: `${config.footer.bottom}px`,
          left: '96px',
          display: 'flex',
          alignItems: 'center',
          color: COLORS.footer,
        }}
      >
        <span
          style={{
            fontSize: `${config.footer.fontSize}px`,
            letterSpacing: '0.1em',
            fontWeight: 600,
            opacity: 0.6,
          }}
        >
          poemd.dev
        </span>
      </div>
    </div>

    <div style={BASE_STYLES.borderOverlay} />
  </div>
)
