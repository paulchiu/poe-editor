/**
 * Downloads a file with the given content to the user's computer
 * @param filename - The name of the file to download
 * @param content - The content to write to the file
 * @param mimeType - The MIME type of the file (defaults to text/plain)
 */
export function downloadFile(
  filename: string,
  content: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
