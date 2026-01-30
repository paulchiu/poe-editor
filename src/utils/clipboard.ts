/**
 * Utility for copying text and HTML to the clipboard.
 * 
 * @param text - Plain text to copy
 * @param html - HTML content to copy
 * @returns Promise that resolves when the copy operation completes
 */
export async function copyToClipboard(text: string, html?: string): Promise<void> {
  if (html && typeof ClipboardItem !== 'undefined') {
    const textBlob = new Blob([text], { type: 'text/plain' })
    const htmlBlob = new Blob([html], { type: 'text/html' })
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      }),
    ])
  } else {
    await navigator.clipboard.writeText(text)
  }
}

/**
 * Strips HTML tags from a string and returns plain text.
 * 
 * @param html - HTML content
 * @returns Plain text content
 */
export function stripHtml(html: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}
