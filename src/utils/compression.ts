import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export interface DocumentData {
  content: string
  name?: string
}

/**
 * Compresses text to a URL-safe hash string using LZ compression
 * @param text - The text to compress
 * @returns Compressed, URL-encoded string (empty string if input is empty)
 */
export function compressToHash(text: string): string {
  if (!text) return ''
  return compressToEncodedURIComponent(text)
}

/**
 * Decompresses a URL-safe hash string back to original text
 * @param hash - The compressed hash string to decompress
 * @returns Decompressed text, empty string if hash is empty, or null if decompression fails
 */
export function decompressFromHash(hash: string): string | null {
  if (!hash) return ''
  try {
    const result = decompressFromEncodedURIComponent(hash)
    return result ?? null
  } catch {
    return null
  }
}

/**
 * Compresses document data (content + name) to a URL-safe hash string
 * @param data - The document data to compress
 * @returns Compressed, URL-encoded string
 */
export function compressDocumentToHash(data: DocumentData): string {
  const json = JSON.stringify(data)
  return compressToEncodedURIComponent(json)
}

/**
 * Decompresses a URL-safe hash string back to document data
 * Falls back to treating the hash as plain content if it's not valid JSON
 * @param hash - The compressed hash string to decompress
 * @returns Document data, or null if decompression fails
 */
export function decompressDocumentFromHash(hash: string): DocumentData | null {
  if (!hash) return { content: '' }

  try {
    const decompressed = decompressFromEncodedURIComponent(hash)
    if (!decompressed) return null

    // Try to parse as JSON (new format with name + content)
    try {
      const parsed = JSON.parse(decompressed)
      // Validate the structure
      if (typeof parsed === 'object' && 'content' in parsed) {
        return {
          content: parsed.content,
          name: parsed.name,
        }
      }
    } catch {
      // Not JSON, treat as legacy format (plain content)
    }

    // Legacy format: just content, no name
    return { content: decompressed }
  } catch {
    return null
  }
}
