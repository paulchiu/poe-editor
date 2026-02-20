/**
 * Represents a segment of parsed HTML content.
 * Either a raw HTML string or mermaid diagram source code.
 */
export type HtmlSegment = { type: 'html'; content: string } | { type: 'mermaid'; code: string }

/**
 * Splits an HTML string at `<pre><code class="...language-mermaid...">` blocks,
 * extracting the mermaid source code from each match.
 * @param html - The full HTML string from markdown rendering
 * @returns An array of segments alternating between HTML and mermaid code
 */
export function splitHtmlAtMermaid(html: string): HtmlSegment[] {
  // Match <pre><code class="hljs language-mermaid">...code...</code></pre>
  const pattern = /<pre><code class="[^"]*language-mermaid[^"]*">([\s\S]*?)<\/code><\/pre>/g

  const segments: HtmlSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    // Add the HTML before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'html', content: html.slice(lastIndex, match.index) })
    }

    // Decode HTML entities in the mermaid source
    const code = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    segments.push({ type: 'mermaid', code })
    lastIndex = match.index + match[0].length
  }

  // Add any remaining HTML after the last match
  if (lastIndex < html.length) {
    segments.push({ type: 'html', content: html.slice(lastIndex) })
  }

  return segments
}
