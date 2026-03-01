const UNICODE_EMOJI_PATTERN = /\p{Extended_Pictographic}/u
const SHORTCODE_EMOJI_PATTERN = /:[a-zA-Z0-9_+-]+:/

/**
 * Extracts the first emoji from the given text.
 * Uses Unicode property escapes to detect extended pictographics.
 *
 * @param text - The text to search for an emoji
 * @returns The first emoji found, or null if none exists
 */
export function extractFirstEmoji(text: string): string | null {
  if (!text) return null

  // Regex to match the first emoji.
  // \p{Extended_Pictographic} matches most emojis and pictographs.
  // We need the 'u' flag for unicode property escapes (implied in modern envs or explicit).
  // Note: This might match some characters that are not strictly "emoji" in the sense of colorful icons
  // depending on the exact unicode definition, but it's the standard way to detect them.
  // We might want to be more specific if we find it matching unwanted chars,
  // but for a favicon extractor, this is usually sufficient.
  //
  // Capturing the first match.
  const match = text.match(UNICODE_EMOJI_PATTERN)

  return match ? match[0] : null
}

/**
 * Checks whether the provided token is an emoji shortcode token like `:smile:`.
 * @param token - Candidate emoji token.
 * @returns `true` when the token is a shortcode token.
 */
export function isEmojiShortcodeToken(token: string): boolean {
  return /^:[a-zA-Z0-9_+-]+:$/.test(token)
}

/**
 * Extracts the first emoji token from text, supporting Unicode emoji and shortcode tokens.
 * @param text - The text to search.
 * @returns First emoji token in document order, or null when none exists.
 */
export function extractFirstEmojiToken(text: string): string | null {
  if (!text) return null

  const unicodeMatch = UNICODE_EMOJI_PATTERN.exec(text)
  const shortcodeMatch = SHORTCODE_EMOJI_PATTERN.exec(text)

  if (!unicodeMatch && !shortcodeMatch) {
    return null
  }

  if (!unicodeMatch) {
    return shortcodeMatch?.[0] ?? null
  }

  if (!shortcodeMatch) {
    return unicodeMatch[0]
  }

  return unicodeMatch.index <= shortcodeMatch.index ? unicodeMatch[0] : shortcodeMatch[0]
}
