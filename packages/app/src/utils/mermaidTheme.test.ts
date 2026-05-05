import { describe, expect, it } from 'vitest'
import { getMermaidInitializeOptions, getMermaidInitScript } from '@/utils/mermaidTheme'

type ThemeVariables = ReturnType<typeof getMermaidInitializeOptions>['themeVariables']

const DARK_TABLE_BACKGROUND_KEYS = [
  'attributeBackgroundColorOdd',
  'attributeBackgroundColorEven',
  'nodeBkg',
  'mainBkg',
  'altBackground',
  'sectionBkgColor',
  'altSectionBkgColor',
  'sectionBkgColor2',
  'excludeBkgColor',
  'taskBkgColor',
  'rowOdd',
  'rowEven',
] as const satisfies readonly (keyof ThemeVariables)[]

const toLinearChannel = (channel: number): number => {
  const value = channel / 255
  return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const toRgb = (hexColor: string): [number, number, number] => {
  const normalized = hexColor.replace(/^#/, '')

  if (!/^[\dA-Fa-f]{6}$/.test(normalized)) {
    throw new Error(`Expected a 6-digit hex color, received ${hexColor}`)
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

const getRelativeLuminance = (hexColor: string): number => {
  const [red, green, blue] = toRgb(hexColor).map(toLinearChannel)
  return 0.212_6 * red + 0.715_2 * green + 0.072_2 * blue
}

const getContrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = getRelativeLuminance(foreground)
  const backgroundLuminance = getRelativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

describe('mermaidTheme', () => {
  it('returns light options aligned with light palette', () => {
    const options = getMermaidInitializeOptions('light')

    expect(options.theme).toBe('base')
    expect(options.startOnLoad).toBe(false)
    expect(options.themeVariables.primaryColor).toBe('#f0efeb')
    expect(options.themeVariables.primaryTextColor).toBe('#2a2a2a')
    expect(options.themeVariables.primaryBorderColor).toBe('#8b6f47')
    expect(options.themeVariables.textColor).toBe('#2a2a2a')
    expect(options.themeVariables.attributeBackgroundColorOdd).toBe('#faf9f7')
    expect(options.themeVariables.attributeBackgroundColorEven).toBe('#f0efeb')
    expect(options.themeVariables.altSectionBkgColor).toBe('#faf9f7')
    expect(options.themeVariables.rowEven).toBe('#f0efeb')
  })

  it('returns dark options aligned with dark palette', () => {
    const options = getMermaidInitializeOptions('dark')

    expect(options.theme).toBe('base')
    expect(options.startOnLoad).toBe(false)
    expect(options.themeVariables.primaryColor).toBe('#151b23')
    expect(options.themeVariables.primaryTextColor).toBe('#ffffff')
    expect(options.themeVariables.primaryBorderColor).toBe('#4493f8')
    expect(options.themeVariables.textColor).toBe('#ffffff')
    expect(options.themeVariables.attributeBackgroundColorOdd).toBe('#151b23')
    expect(options.themeVariables.attributeBackgroundColorEven).toBe('#1f2630')
    expect(options.themeVariables.altSectionBkgColor).toBe('#1f2630')
    expect(options.themeVariables.rowEven).toBe('#1f2630')
  })

  it('keeps dark table backgrounds readable against white text', () => {
    const options = getMermaidInitializeOptions('dark')

    const darkTableBackgrounds = DARK_TABLE_BACKGROUND_KEYS.map(
      (key) => options.themeVariables[key]
    )

    expect(darkTableBackgrounds).toEqual([
      '#151b23',
      '#1f2630',
      '#151b23',
      '#0d1117',
      '#1f2630',
      '#151b23',
      '#1f2630',
      '#0d1117',
      '#1f2630',
      '#151b23',
      '#151b23',
      '#1f2630',
    ])

    for (const background of darkTableBackgrounds) {
      expect(getContrastRatio('#ffffff', background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('returns print options aligned with monochrome palette', () => {
    const options = getMermaidInitializeOptions('print')

    expect(options.theme).toBe('base')
    expect(options.startOnLoad).toBe(false)
    expect(options.themeVariables.background).toBe('#ffffff')
    expect(options.themeVariables.primaryColor).toBe('#ffffff')
    expect(options.themeVariables.primaryTextColor).toBe('#000000')
    expect(options.themeVariables.primaryBorderColor).toBe('#000000')
    expect(options.themeVariables.textColor).toBe('#000000')
    expect(options.themeVariables.attributeBackgroundColorOdd).toBe('#ffffff')
    expect(options.themeVariables.attributeBackgroundColorEven).toBe('#f0f0f0')
    expect(options.themeVariables.altSectionBkgColor).toBe('#f0f0f0')
    expect(options.themeVariables.rowEven).toBe('#f0f0f0')
  })

  it('returns copied objects so callers cannot mutate shared config', () => {
    const first = getMermaidInitializeOptions('light')
    first.themeVariables.primaryColor = '#000000'

    const second = getMermaidInitializeOptions('light')
    expect(second.themeVariables.primaryColor).toBe('#f0efeb')
  })

  it('serializes initialize and run script for exports', () => {
    const script = getMermaidInitScript('dark')

    expect(script).toContain('document.readyState')
    expect(script).toContain("document.addEventListener('DOMContentLoaded'")
    expect(script).toContain('mermaid.initialize(')
    expect(script).toContain('"primaryBorderColor":"#4493f8"')
    expect(script).toContain('"attributeBackgroundColorEven":"#1f2630"')
    expect(script).toContain("mermaid.run({ querySelector: '.language-mermaid' })")
  })
})
