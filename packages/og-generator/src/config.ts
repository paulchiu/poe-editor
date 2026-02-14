/**
 * Configuration for different OG image variants
 */

export interface ImageConfig {
  width: number
  height: number
  title: { fontSize: number; lineHeight: number }
  subtitle: { fontSize: number; marginTop: number }
  divider: { width: number; marginTop: number; marginBottom: number }
  tagline: { fontSize: number; lineHeight?: number; maxWidth?: number }
  footer: { fontSize: number; bottom: number }
  splash: { right: string; top: string; width: string; height: string; opacity: number }
}

export const HOME_CONFIG: ImageConfig = {
  width: 1200,
  height: 630,
  title: { fontSize: 130, lineHeight: 0.9 },
  subtitle: { fontSize: 48, marginTop: 8 },
  divider: { width: 128, marginTop: 40, marginBottom: 40 },
  tagline: { fontSize: 36 },
  footer: { fontSize: 20, bottom: 48 },
  splash: { right: '-50px', top: '-35px', width: '700px', height: '700px', opacity: 0.5 },
}

export const TWITTER_CONFIG: ImageConfig = {
  width: 1200,
  height: 1200,
  title: { fontSize: 160, lineHeight: 0.85 },
  subtitle: { fontSize: 64, marginTop: 16 },
  divider: { width: 160, marginTop: 56, marginBottom: 56 },
  tagline: { fontSize: 48, lineHeight: 1.2, maxWidth: 700 },
  footer: { fontSize: 24, bottom: 64 },
  splash: { right: '-600px', top: '-100px', width: '1400px', height: '1400px', opacity: 0.2 },
}
