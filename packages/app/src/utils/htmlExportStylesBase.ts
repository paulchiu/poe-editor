import type { MermaidColorMode } from '@/utils/mermaidTheme'

interface HtmlExportBaseStylesParams {
  bodyColors: string
  colorMode: MermaidColorMode
  codeBlockVariables: string
  codeSyntaxVariables: string
  frontMatterVariables: string
  mermaidTextColor: string
}

/**
 * Returns base inline CSS (screen + shared styles) used by exported HTML documents.
 * @param params - Interpolated values used by the base style template.
 * @returns Base CSS text for the export document style tag.
 */
export function getHtmlExportBaseStyles({
  bodyColors,
  colorMode,
  codeBlockVariables,
  codeSyntaxVariables,
  frontMatterVariables,
  mermaidTextColor,
}: HtmlExportBaseStylesParams): string {
  return `
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
      font-family: 'Crimson Text', serif;
      font-size: 1rem;
      line-height: 1.3;
${codeBlockVariables}
${codeSyntaxVariables}
${frontMatterVariables}
    }
    .markdown-body code,
    .markdown-body pre,
    .markdown-body tt {
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
    .markdown-body .contains-task-list {
      list-style: none;
      padding-left: 1.4rem;
    }
    .markdown-body .task-list-item {
      list-style: none;
    }
    .markdown-body .task-list-item > .task-list-item-checkbox {
      margin: 0 0.5rem 0.1rem 0;
      inline-size: 0.95rem;
      block-size: 0.95rem;
      vertical-align: middle;
      accent-color: var(--fgColor-accent);
    }
    .markdown-body .front-matter-properties {
      margin: 0 0 1.25rem;
      padding: 0.35rem 0 0.75rem;
      border-bottom: 1px solid var(--borderColor-muted);
      color: var(--fgColor-default);
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.875rem;
      line-height: 1.35;
    }
    .markdown-body .front-matter-properties table {
      display: table;
      width: 100%;
      margin: 0;
      border: 0;
      border-collapse: collapse;
    }
    .markdown-body .front-matter-properties tr,
    .markdown-body .front-matter-properties tr:nth-child(2n) {
      border: 0;
      background: transparent;
    }
    .markdown-body .front-matter-properties th,
    .markdown-body .front-matter-properties td {
      padding: 0.32rem 0;
      border: 0;
      vertical-align: top;
    }
    .markdown-body .front-matter-properties th {
      width: 9rem;
      padding-right: 1rem;
      color: var(--front-matter-key-color);
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
    }
    .markdown-body .front-matter-properties .front-matter-nested-table {
      display: table;
      width: auto;
      min-width: min(22rem, 100%);
      margin: 0;
      border: 0;
      border-collapse: collapse;
    }
    .markdown-body .front-matter-nested-table .front-matter-nested-row {
      border: 0;
      background: transparent;
    }
    .markdown-body .front-matter-nested-table .front-matter-nested-key,
    .markdown-body .front-matter-nested-table .front-matter-nested-value {
      padding: 0.12rem 0;
      border: 0;
      vertical-align: top;
    }
    .markdown-body .front-matter-nested-table .front-matter-nested-key {
      width: auto;
      min-width: 8rem;
      padding-right: 1rem;
      color: var(--front-matter-key-color);
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
    }
    .markdown-body .front-matter-list,
    .markdown-body .front-matter-boolean {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }
    .markdown-body .front-matter-chip {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      min-height: 1.45rem;
      padding: 0.12rem 0.45rem;
      border: 1px solid var(--front-matter-chip-border);
      border-radius: 999px;
      background: var(--front-matter-chip-bg);
      color: var(--fgColor-default);
      font-size: 0.78rem;
      line-height: 1.2;
    }
    .markdown-body .front-matter-tag {
      border-color: var(--front-matter-tag-border);
      background: var(--front-matter-tag-bg);
      color: var(--fgColor-accent);
    }
    .markdown-body .front-matter-empty {
      color: var(--fgColor-muted);
      font-style: italic;
    }
    .markdown-body .front-matter-boolean input {
      inline-size: 0.95rem;
      block-size: 0.95rem;
      margin: 0;
      accent-color: var(--fgColor-accent);
    }
    .markdown-body .front-matter-boolean-label,
    .markdown-body .front-matter-value-text {
      overflow-wrap: anywhere;
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
    .markdown-body .preview-code-copy-host {
      position: relative;
    }
    .markdown-body .preview-code-copy-button {
      position: absolute;
      top: 0.6rem;
      right: 0.5rem;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      height: 1.5rem;
      padding: 0 0.55rem;
      border: 1px solid var(--code-block-header-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--code-block-header-background) 85%, var(--code-block-background));
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    }
    .markdown-body .preview-mermaid-copy-controls {
      position: absolute;
      top: 0.3rem;
      right: 0.5rem;
      z-index: 3;
      display: flex;
      align-items: stretch;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .markdown-body .preview-mermaid-download-svg-button,
    .markdown-body .preview-mermaid-copy-menu-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      height: 1.5rem;
      border: 1px solid var(--code-block-header-border);
      background: color-mix(in srgb, var(--code-block-header-background) 85%, var(--code-block-background));
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    }
    .markdown-body .preview-mermaid-download-svg-button {
      padding: 0 0.55rem;
      border-top-left-radius: 999px;
      border-bottom-left-radius: 999px;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .markdown-body .preview-mermaid-copy-menu-toggle {
      width: 1.8rem;
      border-left: 0;
      border-top-right-radius: 999px;
      border-bottom-right-radius: 999px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding: 0;
      line-height: 1;
    }
    .markdown-body .preview-mermaid-copy-menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      min-width: 8.25rem;
      padding: 0.25rem;
      border: 1px solid var(--code-block-header-border);
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--code-block-header-background) 92%, var(--code-block-background));
      box-shadow: 0 10px 30px color-mix(in srgb, var(--code-block-foreground) 18%, transparent);
      display: none;
    }
    .markdown-body .preview-mermaid-copy-controls.is-open .preview-mermaid-copy-menu {
      display: block;
    }
    .markdown-body .preview-mermaid-copy-code-button {
      display: inline-flex;
      width: 100%;
      align-items: center;
      gap: 0.35rem;
      height: 1.7rem;
      border: 0;
      border-radius: 0.35rem;
      background: transparent;
      color: var(--code-block-header-color);
      font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.69rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0.45rem;
    }
    .markdown-body .preview-mermaid-copy-code-button:hover {
      color: var(--code-block-foreground);
      background: color-mix(in srgb, var(--code-block-background) 74%, transparent);
    }
    .markdown-body pre.preview-code-copy-host > .preview-code-copy-button {
      top: 0.55rem;
    }
    .markdown-body .preview-code-copy-host:hover > .preview-code-copy-button,
    .markdown-body .preview-code-copy-button:focus-visible,
    .markdown-body .preview-code-copy-button[data-copied='true'],
    .markdown-body .preview-code-copy-host:hover > .preview-mermaid-copy-controls,
    .markdown-body .preview-mermaid-copy-controls:focus-within,
    .markdown-body .preview-mermaid-copy-controls.is-open {
      opacity: 1;
    }
    .markdown-body .preview-code-copy-button:hover {
      color: var(--code-block-foreground);
      border-color: var(--code-block-border);
      background: color-mix(in srgb, var(--code-block-header-background) 95%, var(--code-block-background));
    }
    .markdown-body .preview-mermaid-download-svg-button:hover,
    .markdown-body .preview-mermaid-copy-menu-toggle:hover {
      color: var(--code-block-foreground);
      border-color: var(--code-block-border);
      background: color-mix(in srgb, var(--code-block-header-background) 95%, var(--code-block-background));
    }
    .markdown-body .preview-code-copy-button:focus-visible {
      outline: 2px solid #1f6feb;
      outline-offset: 1px;
    }
    .markdown-body .preview-mermaid-download-svg-button:focus-visible,
    .markdown-body .preview-mermaid-copy-menu-toggle:focus-visible,
    .markdown-body .preview-mermaid-copy-code-button:focus-visible {
      outline: 2px solid #1f6feb;
      outline-offset: 1px;
    }
    .markdown-body .preview-code-copy-button .preview-code-copy-icon {
      width: 0.9rem;
      height: 0.9rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
      display: block;
    }
    .markdown-body .preview-code-copy-button .preview-code-copy-icon rect {
      fill: none;
    }
    .markdown-body .preview-mermaid-download-svg-button .preview-code-copy-icon,
    .markdown-body .preview-mermaid-copy-code-button .preview-code-copy-icon {
      width: 0.9rem;
      height: 0.9rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
      display: block;
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
    .markdown-body pre code,
    .markdown-body .code-block-with-language pre code {
      color: var(--code-block-foreground);
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
    .markdown-body .hljs-addition {
      color: var(--color-prettylights-syntax-markup-inserted-text);
      background-color: var(--color-prettylights-syntax-markup-inserted-bg);
    }
    .markdown-body .hljs-deletion {
      color: var(--color-prettylights-syntax-markup-deleted-text);
      background-color: var(--color-prettylights-syntax-markup-deleted-bg);
    }
    .markdown-body .code-block-with-language[data-language='diff'] .hljs-comment,
    .markdown-body .code-block-with-language[data-language='patch'] .hljs-comment {
      color: var(--color-prettylights-syntax-meta-diff-range);
    }
    .markdown-body svg[id^='mermaid-'] text,
    .markdown-body svg[id^='mermaid-'] tspan,
    .markdown-body svg[id^='mermaid-'] .label,
    .markdown-body svg[id^='mermaid-'] foreignObject div {
      fill: ${mermaidTextColor} !important;
      color: ${mermaidTextColor} !important;
    }
`
}
