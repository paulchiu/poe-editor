export type MermaidColorMode = 'light' | 'dark' | 'print'

interface MermaidThemeVariables {
  background: string
  primaryColor: string
  primaryTextColor: string
  primaryBorderColor: string
  textColor: string
  secondaryColor: string
  secondaryTextColor: string
  tertiaryColor: string
  tertiaryTextColor: string
  lineColor: string
  clusterBkg: string
  clusterBorder: string
  edgeLabelBackground: string
  fontFamily: string
}

export interface MermaidInitializeOptions {
  startOnLoad: boolean
  theme: 'base'
  themeVariables: MermaidThemeVariables
}

const MERMAID_THEME_OPTIONS: Record<MermaidColorMode, MermaidInitializeOptions> = {
  light: {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      // Align with light design tokens and markdown palette.
      background: '#faf9f7',
      primaryColor: '#f0efeb',
      primaryTextColor: '#2a2a2a',
      primaryBorderColor: '#8b6f47',
      textColor: '#2a2a2a',
      secondaryColor: '#faf9f7',
      secondaryTextColor: '#2a2a2a',
      tertiaryColor: '#f0efeb',
      tertiaryTextColor: '#2a2a2a',
      lineColor: '#8b6f47',
      clusterBkg: '#f0efeb',
      clusterBorder: '#e5e3df',
      edgeLabelBackground: '#faf9f7',
      fontFamily: 'Crimson Text, serif',
    },
  },
  dark: {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      // Align with existing dark markdown colors.
      background: '#0d1117',
      primaryColor: '#151b23',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#4493f8',
      textColor: '#ffffff',
      secondaryColor: '#0d1117',
      secondaryTextColor: '#ffffff',
      tertiaryColor: '#151b23',
      tertiaryTextColor: '#ffffff',
      lineColor: '#4493f8',
      clusterBkg: '#151b23',
      clusterBorder: '#3d444d',
      edgeLabelBackground: '#151b23',
      fontFamily: 'Crimson Text, serif',
    },
  },
  print: {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      // Dedicated monochrome palette for printer-friendly rendering.
      background: '#ffffff',
      primaryColor: '#ffffff',
      primaryTextColor: '#000000',
      primaryBorderColor: '#000000',
      textColor: '#000000',
      secondaryColor: '#ffffff',
      secondaryTextColor: '#000000',
      tertiaryColor: '#ffffff',
      tertiaryTextColor: '#000000',
      lineColor: '#000000',
      clusterBkg: '#ffffff',
      clusterBorder: '#000000',
      edgeLabelBackground: '#ffffff',
      fontFamily: 'Crimson Text, serif',
    },
  },
}

/**
 * Returns Mermaid initialization options for the active color mode.
 * @param colorMode - The application color mode
 * @returns Mermaid options with theme variables matching the app palette
 */
export function getMermaidInitializeOptions(colorMode: MermaidColorMode): MermaidInitializeOptions {
  const options = MERMAID_THEME_OPTIONS[colorMode]

  return {
    ...options,
    themeVariables: {
      ...options.themeVariables,
    },
  }
}

/**
 * Returns a serialized Mermaid init script for static HTML export.
 * @param colorMode - The application color mode
 * @returns Script body that initializes and runs Mermaid diagrams
 */
export function getMermaidInitScript(colorMode: MermaidColorMode): string {
  const options = getMermaidInitializeOptions(colorMode)
  return `(() => {
  const runMermaid = () => {
    if (typeof mermaid === 'undefined') return
    mermaid.initialize(${JSON.stringify(options)})
    mermaid.run({ querySelector: '.language-mermaid' })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMermaid, { once: true })
  } else {
    runMermaid()
  }
})()`
}
