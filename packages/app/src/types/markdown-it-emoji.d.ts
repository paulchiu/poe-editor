declare module 'markdown-it-emoji' {
  import type { MarkdownIt } from 'markdown-it'

  type MarkdownItEmojiPlugin = (markdown: MarkdownIt) => void

  export const bare: MarkdownItEmojiPlugin
  export const light: MarkdownItEmojiPlugin
  export const full: MarkdownItEmojiPlugin
}

declare module 'markdown-it-emoji/lib/data/full.mjs' {
  const emojiMap: Record<string, string>
  export default emojiMap
}
