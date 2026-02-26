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

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode SVG image'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

async function svgToPngBlob(svg: string): Promise<Blob> {
  const image = await loadSvgImage(svg)
  const width = image.naturalWidth || image.width || 1
  const height = image.naturalHeight || image.height || 1
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context unavailable')
  }

  context.drawImage(image, 0, 0, width, height)
  return canvasToBlob(canvas)
}

/**
 * Copies Mermaid SVG markup as an image to the clipboard.
 *
 * @param svg - Serialized SVG markup to copy as an image.
 * @returns Promise that resolves when image copy succeeds.
 */
export async function copySvgImageToClipboard(svg: string): Promise<void> {
  if (!svg.trim()) {
    throw new Error('No SVG content to copy')
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Image clipboard API is unavailable')
  }

  const svgBlob = new Blob([svg], { type: 'image/svg+xml' })

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/svg+xml': svgBlob,
      }),
    ])
  } catch {
    const pngBlob = await svgToPngBlob(svg)
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngBlob,
      }),
    ])
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
