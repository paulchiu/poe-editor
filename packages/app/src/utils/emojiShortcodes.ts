interface EmojiShortcodeMap {
  [shortcode: string]: string
}

/**
 * Represents a GitHub-style emoji shortcode and its unicode glyph.
 */
export interface EmojiShortcodeEntry {
  shortcode: string
  emoji: string
}

let emojiShortcodeEntriesPromise: Promise<EmojiShortcodeEntry[]> | null = null

/**
 * Lazily loads emoji shortcodes from the markdown-it emoji dataset.
 * @returns Sorted shortcode entries suitable for UI and autocomplete.
 */
export async function getEmojiShortcodeEntries(): Promise<EmojiShortcodeEntry[]> {
  if (!emojiShortcodeEntriesPromise) {
    emojiShortcodeEntriesPromise = (async () => {
      const module = await import('markdown-it-emoji/lib/data/full.mjs')
      const shortcodeMap = module.default as EmojiShortcodeMap

      return Object.entries(shortcodeMap)
        .map(([shortcode, emoji]) => ({ shortcode, emoji }))
        .sort((a, b) => a.shortcode.localeCompare(b.shortcode))
    })()
  }

  try {
    return await emojiShortcodeEntriesPromise
  } catch (error) {
    emojiShortcodeEntriesPromise = null
    throw error
  }
}

/**
 * Filters and ranks shortcode entries for search and suggestion UIs.
 * @param entries - Full shortcode entry list.
 * @param query - User-entered search query (without surrounding colons).
 * @param limit - Maximum number of entries to return.
 * @returns Ranked entries matching the query.
 */
export function filterEmojiShortcodeEntries(
  entries: readonly EmojiShortcodeEntry[],
  query: string,
  limit: number
): EmojiShortcodeEntry[] {
  const normalizedQuery = query.trim().toLowerCase()
  const clampedLimit = Math.max(1, limit)

  const score = (shortcode: string): number => {
    if (!normalizedQuery) return 0
    if (shortcode.startsWith(normalizedQuery)) return 0
    if (shortcode.includes(normalizedQuery)) return 1
    return 2
  }

  return entries
    .filter((entry) => {
      if (!normalizedQuery) return true
      return entry.shortcode.includes(normalizedQuery)
    })
    .sort((a, b) => {
      const scoreDiff = score(a.shortcode) - score(b.shortcode)
      if (scoreDiff !== 0) return scoreDiff
      return a.shortcode.localeCompare(b.shortcode)
    })
    .slice(0, clampedLimit)
}

/**
 * Resets lazy-loaded shortcode cache for isolated tests.
 * @returns void
 */
export function resetEmojiShortcodeCacheForTests(): void {
  emojiShortcodeEntriesPromise = null
}
