import { getMermaidInitScript, type MermaidColorMode } from '@/utils/mermaidTheme'

interface BuildHtmlExportDocumentParams {
  documentName: string
  htmlContent: string
  colorMode: MermaidColorMode
}

function getCodeBlockVariables(colorMode: MermaidColorMode): string {
  if (colorMode === 'dark') {
    return `
      --code-block-border: #3d444db3;
      --code-block-background: #151b23;
      --code-block-header-border: #3d444db3;
      --code-block-header-background: #0d1117;
      --code-block-header-color: #9198a1;
      --code-block-foreground: #f0f6fc;`
  }

  return `
      --code-block-border: #c8b28f;
      --code-block-background: #f0efeb;
      --code-block-header-border: #dbcdb6;
      --code-block-header-background: #faf9f7;
      --code-block-header-color: #6f5738;
      --code-block-foreground: #2a2a2a;`
}

function getCodeSyntaxVariables(colorMode: MermaidColorMode): string {
  if (colorMode === 'dark') {
    return `
      --code-syntax-keyword: var(--color-prettylights-syntax-keyword);
      --code-syntax-string: var(--color-prettylights-syntax-string);
      --code-syntax-variable: var(--color-prettylights-syntax-variable);
      --code-syntax-number: var(--color-prettylights-syntax-variable);
      --code-syntax-entity: var(--color-prettylights-syntax-entity);
      --code-syntax-comment: var(--color-prettylights-syntax-comment);`
  }

  return `
      --code-syntax-keyword: #a626a4;
      --code-syntax-string: #50a14f;
      --code-syntax-variable: #986801;
      --code-syntax-number: #986801;
      --code-syntax-entity: #005cc5;
      --code-syntax-comment: #6a737d;`
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
  const hasMermaid = htmlContent.includes('language-mermaid')
  const markdownStylesheet = `https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-${colorMode}.min.css`
  const bodyColors =
    colorMode === 'dark'
      ? 'background-color: #0d1117; color: #f0f6fc;'
      : 'background-color: #ffffff; color: #24292f;'
  const codeBlockVariables = getCodeBlockVariables(colorMode)
  const codeSyntaxVariables = getCodeSyntaxVariables(colorMode)

  const mermaidScripts = hasMermaid
    ? `\n  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.min.js"></script>\n  <script>${getMermaidInitScript(colorMode)}</script>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="${colorMode}">
  <title>${documentName}</title>
  <link rel="stylesheet" href="${markdownStylesheet}">${mermaidScripts}
  <style>
    body {
      margin: 0;
      ${bodyColors}
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      color-scheme: ${colorMode};
${codeBlockVariables}
${codeSyntaxVariables}
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
    .markdown-body pre {
      margin: 1rem 0;
      overflow: hidden;
      border: 1px solid var(--code-block-border);
      border-radius: 12px;
      background: var(--code-block-background);
    }
    .markdown-body .code-block-with-language {
      margin: 1rem 0;
      overflow: hidden;
      border: 1px solid var(--code-block-border);
      border-radius: 12px;
      background: var(--code-block-background);
    }
    .markdown-body .code-block-language-hint {
      display: flex;
      align-items: center;
      min-height: 2rem;
      padding: 0.35rem 0.8rem;
      border-bottom: 1px solid var(--code-block-header-border);
      color: var(--code-block-header-color);
      background: var(--code-block-header-background);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .markdown-body .code-block-with-language pre {
      margin: 0;
      border: 0;
      border-radius: 0;
      background: transparent !important;
    }
    .markdown-body .code-block-with-language[data-language="mermaid"] {
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    .markdown-body .code-block-with-language[data-language="mermaid"] .code-block-language-hint {
      display: none;
    }
    .markdown-body .code-block-with-language pre code.hljs {
      display: block;
      padding: 0;
      background: transparent;
    }
    .markdown-body .hljs {
      color: var(--code-block-foreground);
    }
    .markdown-body .hljs-keyword,
    .markdown-body .hljs-selector-tag,
    .markdown-body .hljs-literal,
    .markdown-body .hljs-doctag,
    .markdown-body .hljs-operator {
      color: var(--code-syntax-keyword);
    }
    .markdown-body .hljs-string,
    .markdown-body .hljs-meta .hljs-string,
    .markdown-body .hljs-attribute,
    .markdown-body .hljs-regexp {
      color: var(--code-syntax-string);
    }
    .markdown-body .hljs-number,
    .markdown-body .hljs-symbol,
    .markdown-body .hljs-variable,
    .markdown-body .hljs-template-variable {
      color: var(--code-syntax-number);
    }
    .markdown-body .hljs-title,
    .markdown-body .hljs-title.class_,
    .markdown-body .hljs-title.function_ {
      color: var(--code-syntax-entity);
    }
    .markdown-body .hljs-comment,
    .markdown-body .hljs-quote {
      color: var(--code-syntax-comment);
    }
  </style>
</head>
<body class="markdown-body">
${htmlContent}
</body>
</html>`
}
