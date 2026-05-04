const HTML_EXPORT_PRINT_STYLES = `
    @media print {
      @page {
        margin: 12mm;
      }
      body {
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .markdown-body {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        color: #000 !important;
        color-scheme: light !important;
        --fgColor-default: #000;
        --fgColor-muted: #000;
        --fgColor-accent: #000;
        --fgColor-success: #000;
        --fgColor-attention: #000;
        --fgColor-danger: #000;
        --fgColor-done: #000;
        --bgColor-default: #fff;
        --bgColor-muted: #fff;
        --bgColor-neutral-muted: #fff;
        --bgColor-attention-muted: #fff;
        --borderColor-default: #000;
        --borderColor-muted: #000;
        --borderColor-neutral-muted: #000;
        --borderColor-accent-emphasis: #000;
        --borderColor-success-emphasis: #000;
        --borderColor-attention-emphasis: #000;
        --borderColor-danger-emphasis: #000;
        --borderColor-done-emphasis: #000;
        --code-syntax-keyword: #000;
        --code-syntax-string: #000;
        --code-syntax-variable: #000;
        --code-syntax-number: #000;
        --code-syntax-entity: #000;
        --code-syntax-comment: #000;
      }
      .markdown-body p {
        margin: 0 0 0.8rem;
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4,
      .markdown-body h5,
      .markdown-body h6 {
        margin: 1.1rem 0 0.6rem;
      }
      .markdown-body h1 {
        border-bottom: 1px solid #000;
        padding-bottom: 0.25rem;
      }
      .markdown-body h2 {
        border-bottom: 1px solid #000;
        padding-bottom: 0.2rem;
      }
      .markdown-body ul,
      .markdown-body ol {
        margin: 0.35rem 0 0.9rem;
        padding-left: 1.4rem;
      }
      .markdown-body ul {
        list-style-type: disc;
      }
      .markdown-body ol {
        list-style-type: decimal;
      }
      .markdown-body li {
        margin: 0.2rem 0;
      }
      .markdown-body .footnotes-list {
        list-style-type: decimal;
        padding-left: 1.4rem;
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
        pointer-events: none;
        accent-color: #000;
      }
      .markdown-body a {
        color: #000 !important;
        text-decoration: underline !important;
      }
      .markdown-body code,
      .markdown-body pre,
      .markdown-body tt {
        font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
      }
      .markdown-body blockquote {
        margin: 0 0 0.95rem;
        padding: 0 0.9rem;
        border-left: 3px solid #000;
      }
      .markdown-body table {
        width: 100%;
        border-collapse: collapse;
      }
      .markdown-body table,
      .markdown-body thead,
      .markdown-body tbody,
      .markdown-body tr,
      .markdown-body th,
      .markdown-body td {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #000;
        padding: 0.35rem 0.45rem;
      }
      .markdown-body details {
        margin: 0 0 0.95rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid #000;
        border-radius: 6px;
        background: #fff !important;
      }
      .markdown-body details > * {
        display: block !important;
      }
      .markdown-body details > summary {
        margin: 0 0 0.35rem;
        font-weight: 700;
        list-style: none;
        cursor: default;
      }
      .markdown-body details > summary::marker,
      .markdown-body details > summary::-webkit-details-marker {
        display: none;
        content: '';
      }
      .markdown-body pre,
      .markdown-body .code-block-with-language {
        background: #fff !important;
        color: #000 !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .markdown-body pre code,
      .markdown-body pre code *,
      .markdown-body code.hljs,
      .markdown-body code.hljs * {
        color: #000 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #000 !important;
        text-shadow: none !important;
      }
      .markdown-body .hljs-addition,
      .markdown-body .hljs-deletion {
        background-color: transparent !important;
      }
      .markdown-body .code-block-language-hint {
        color: #000 !important;
        background: #fff !important;
        border-bottom-color: #000 !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg,
      .markdown-body svg[id^='mermaid-'] {
        background: #fff !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg text,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg tspan,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .label,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .nodeLabel,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .edgeLabel,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg foreignObject,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg foreignObject *,
      .markdown-body svg[id^='mermaid-'] text,
      .markdown-body svg[id^='mermaid-'] tspan,
      .markdown-body svg[id^='mermaid-'] .label,
      .markdown-body svg[id^='mermaid-'] .nodeLabel,
      .markdown-body svg[id^='mermaid-'] .edgeLabel,
      .markdown-body svg[id^='mermaid-'] foreignObject,
      .markdown-body svg[id^='mermaid-'] foreignObject * {
        fill: #000 !important;
        color: #000 !important;
        stroke: none !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #000 !important;
        text-shadow: none !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .edgeLabel rect,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .labelBkg,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .edgeLabel foreignObject,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg .edgeLabel foreignObject *,
      .markdown-body svg[id^='mermaid-'] .edgeLabel rect,
      .markdown-body svg[id^='mermaid-'] .labelBkg,
      .markdown-body svg[id^='mermaid-'] .edgeLabel foreignObject,
      .markdown-body svg[id^='mermaid-'] .edgeLabel foreignObject * {
        fill: #fff !important;
        background: #fff !important;
        stroke: #000 !important;
        color: #000 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #000 !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg rect,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg circle,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg ellipse,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg polygon,
      .markdown-body svg[id^='mermaid-'] rect,
      .markdown-body svg[id^='mermaid-'] circle,
      .markdown-body svg[id^='mermaid-'] ellipse,
      .markdown-body svg[id^='mermaid-'] polygon {
        fill: #fff !important;
        stroke: #000 !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg line,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg path,
      .markdown-body .code-block-with-language[data-language='mermaid'] svg polyline,
      .markdown-body svg[id^='mermaid-'] line,
      .markdown-body svg[id^='mermaid-'] path,
      .markdown-body svg[id^='mermaid-'] polyline {
        stroke: #000 !important;
      }
      .markdown-body .code-block-with-language[data-language='mermaid'] svg marker path,
      .markdown-body svg[id^='mermaid-'] marker path {
        fill: #000 !important;
        stroke: #000 !important;
      }
      .markdown-body .preview-code-copy-button,
      .markdown-body .preview-mermaid-copy-controls,
      .markdown-body .preview-mermaid-copy-menu {
        display: none !important;
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4 {
        break-after: avoid-page;
        page-break-after: avoid;
      }
      .markdown-body img,
      .markdown-body svg,
      .markdown-body table,
      .markdown-body blockquote {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
`

/**
 * Returns print-specific inline CSS used by exported HTML documents.
 * @returns Print CSS text for the export document style tag.
 */
export function getHtmlExportPrintStyles(): string {
  return HTML_EXPORT_PRINT_STYLES
}
