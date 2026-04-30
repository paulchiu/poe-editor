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
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timed out while decoding SVG image'))
    }, 1500)

    const cleanup = (): void => {
      window.clearTimeout(timeoutId)
      URL.revokeObjectURL(url)
    }

    image.onload = () => {
      cleanup()
      resolve(image)
    }
    image.onerror = () => {
      cleanup()
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
  const canvas = document.createElement('canvas')
  if (typeof canvas.toBlob !== 'function') {
    throw new Error('Canvas PNG export is unavailable')
  }

  const image = await loadSvgImage(svg)
  const width = image.naturalWidth || image.width || 1
  const height = image.naturalHeight || image.height || 1
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

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': svgToPngBlob(svg),
      }),
    ])
    return
  } catch {
    // Fall back to SVG if PNG copy is not supported in this browser/context.
  }

  try {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/svg+xml': svgBlob,
      }),
    ])
    return
  } catch {
    throw new Error('Failed to copy Mermaid image to clipboard')
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
  const frontMatterSections = Array.from(doc.body.querySelectorAll('.front-matter-properties'))

  for (const section of frontMatterSections) {
    const rows = Array.from(section.querySelectorAll(':scope > table > tbody > tr'))
    const lines = rows
      .map((row) => {
        const key = row.querySelector(':scope > th')?.textContent?.trim() ?? ''
        const valueCell = row.querySelector(':scope > td')
        const value = valueCell ? getFrontMatterCellText(valueCell, 1) : ''
        return key && value
          ? `${key}:${value.startsWith('\n') ? value : ` ${value}`}`
          : key || value
      })
      .filter(Boolean)
    section.replaceWith(doc.createTextNode(lines.length > 0 ? `${lines.join('\n')}\n` : ''))
  }

  return doc.body.textContent || ''
}

function getFrontMatterCellText(valueCell: Element, indentLevel: number): string {
  const nestedRows = Array.from(
    valueCell.querySelectorAll(':scope > .front-matter-nested-table > tbody > tr')
  )
  if (nestedRows.length > 0) {
    const nestedLines = nestedRows
      .map((row) => getFrontMatterRowText(row, indentLevel))
      .filter(Boolean)

    return nestedLines.length > 0 ? `\n${nestedLines.join('\n')}` : ''
  }

  const chips = Array.from(
    valueCell.querySelectorAll(
      ':scope > .front-matter-list > .front-matter-chip, :scope > .front-matter-chip'
    )
  )
  if (chips.length > 0) {
    return chips
      .map((chip) => chip.textContent?.trim())
      .filter(Boolean)
      .join(', ')
  }

  return valueCell.textContent?.trim() ?? ''
}

function getFrontMatterRowText(row: Element, indentLevel: number): string {
  const key = row.querySelector(':scope > th')?.textContent?.trim() ?? ''
  const valueCell = row.querySelector(':scope > td')
  const value = valueCell ? getFrontMatterCellText(valueCell, indentLevel + 1) : ''
  const indent = '  '.repeat(indentLevel)

  if (!key) return value ? `${indent}${value}` : ''
  if (!value) return `${indent}${key}`

  return `${indent}${key}:${value.startsWith('\n') ? value : ` ${value}`}`
}
