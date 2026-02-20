/**
 * Counts the number of words in a string.
 *
 * @param text - The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}
