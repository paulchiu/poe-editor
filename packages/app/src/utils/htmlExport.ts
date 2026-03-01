import { getExportCopyScript } from '@/utils/htmlExportCopyScript'
import { getHtmlExportStyles } from '@/utils/htmlExportStyles'
import { getMermaidInitScript, type MermaidColorMode } from '@/utils/mermaidTheme'

interface BuildHtmlExportDocumentParams {
  documentName: string
  htmlContent: string
  colorMode: MermaidColorMode
}

const FONT_LINKS =
  '\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">'

function getMarkdownStylesheet(colorMode: MermaidColorMode): string {
  return `https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-${colorMode}.min.css`
}

function getMermaidScripts(hasMermaid: boolean, colorMode: MermaidColorMode): string {
  if (!hasMermaid) {
    return ''
  }

  return `\n  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.min.js"></script>\n  <script>${getMermaidInitScript(colorMode)}</script>`
}

/**
 * Builds a complete HTML export document for rendered markdown content.
 * @param params - HTML export options
 * @returns A full HTML document string ready for file download
 */
export function buildHtmlExportDocument({
  documentName,
  htmlContent,
  colorMode,
}: BuildHtmlExportDocumentParams): string {
  const markdownStylesheet = getMarkdownStylesheet(colorMode)
  const hasMermaid = htmlContent.includes('language-mermaid')
  const mermaidScripts = getMermaidScripts(hasMermaid, colorMode)
  const exportStyles = getHtmlExportStyles(colorMode)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="${colorMode}">
  <title>${documentName}</title>
  <link rel="stylesheet" href="${markdownStylesheet}">${FONT_LINKS}
  <script>${getExportCopyScript()}</script>${mermaidScripts}
  <style>${exportStyles}
  </style>
</head>
<body class="markdown-body">
${htmlContent}
</body>
</html>`
}
