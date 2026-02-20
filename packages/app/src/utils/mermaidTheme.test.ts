import { describe, expect, it } from 'vitest'
import { getMermaidInitializeOptions, getMermaidInitScript } from '@/utils/mermaidTheme'

describe('mermaidTheme', () => {
  it('returns light options aligned with light palette', () => {
    const options = getMermaidInitializeOptions('light')

    expect(options.theme).toBe('base')
    expect(options.startOnLoad).toBe(false)
    expect(options.themeVariables.primaryColor).toBe('#f0efeb')
    expect(options.themeVariables.primaryTextColor).toBe('#2a2a2a')
    expect(options.themeVariables.primaryBorderColor).toBe('#8b6f47')
  })

  it('returns dark options aligned with dark palette', () => {
    const options = getMermaidInitializeOptions('dark')

    expect(options.theme).toBe('base')
    expect(options.startOnLoad).toBe(false)
    expect(options.themeVariables.primaryColor).toBe('#151b23')
    expect(options.themeVariables.primaryTextColor).toBe('#f0f6fc')
    expect(options.themeVariables.primaryBorderColor).toBe('#4493f8')
  })

  it('returns copied objects so callers cannot mutate shared config', () => {
    const first = getMermaidInitializeOptions('light')
    first.themeVariables.primaryColor = '#000000'

    const second = getMermaidInitializeOptions('light')
    expect(second.themeVariables.primaryColor).toBe('#f0efeb')
  })

  it('serializes initialize and run script for exports', () => {
    const script = getMermaidInitScript('dark')

    expect(script).toContain('mermaid.initialize(')
    expect(script).toContain('"primaryBorderColor":"#4493f8"')
    expect(script).toContain("mermaid.run({querySelector: '.language-mermaid'});")
  })
})
