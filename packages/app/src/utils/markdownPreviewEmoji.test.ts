import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('renderMarkdownForPreview emoji shortcodes', () => {
  it('converts :smile: to unicode emoji', async () => {
    const { renderMarkdownForPreview } = await import('./markdown')
    const html = await renderMarkdownForPreview('Hello :smile:')

    expect(html).toContain('Hello 😄')
  })

  it('converts :+1: to unicode emoji', async () => {
    const { renderMarkdownForPreview } = await import('./markdown')
    const html = await renderMarkdownForPreview('Ship it :+1:')

    expect(html).toContain('Ship it 👍')
  })

  it('does not convert shortcode text inside inline code or fenced code blocks', async () => {
    const { renderMarkdownForPreview } = await import('./markdown')
    const html = await renderMarkdownForPreview('`:smile:`\n\n```\n:smile:\n```')

    expect(html).toContain('<code>:smile:</code>')
    expect(html).toContain(':smile:')
    expect(html).not.toContain('😄')
  })

  it('does not convert escaped shortcode text', async () => {
    const { renderMarkdownForPreview } = await import('./markdown')
    const html = await renderMarkdownForPreview('\\:smile:')

    expect(html).toContain('<p>:smile:</p>')
    expect(html).not.toContain('😄')
  })
})

describe('renderMarkdownForPreview lazy emoji loading', () => {
  beforeEach(async () => {
    const { resetEmojiMarkdownRendererForTests } = await import('./markdown')
    resetEmojiMarkdownRendererForTests()
  })

  afterEach(async () => {
    const { resetEmojiMarkdownRendererForTests } = await import('./markdown')
    resetEmojiMarkdownRendererForTests()
  })

  it('does not import the emoji module when no shortcode pattern exists', async () => {
    const emojiFactory = vi.fn(async () => ({ full: vi.fn() }))
    const { renderMarkdownForPreview, setEmojiMarkdownModuleLoaderForTests } =
      await import('./markdown')
    setEmojiMarkdownModuleLoaderForTests(emojiFactory)

    await renderMarkdownForPreview('No shortcode candidates in this markdown content.')

    expect(emojiFactory).not.toHaveBeenCalled()
  })

  it('imports the emoji module when shortcode pattern exists', async () => {
    const emojiPlugin = vi.fn()
    const emojiFactory = vi.fn(async () => ({ full: emojiPlugin }))
    const { renderMarkdownForPreview, setEmojiMarkdownModuleLoaderForTests } =
      await import('./markdown')
    setEmojiMarkdownModuleLoaderForTests(emojiFactory)

    await renderMarkdownForPreview('Has :smile: shortcode candidate.')

    expect(emojiFactory).toHaveBeenCalledTimes(1)
    expect(emojiPlugin).toHaveBeenCalledTimes(1)
  })
})
