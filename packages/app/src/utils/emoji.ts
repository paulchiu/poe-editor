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
  const regex = /\p{Extended_Pictographic}/u
  const match = text.match(regex)

  return match ? match[0] : null
}
