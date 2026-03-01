import type { MermaidColorMode } from '@/utils/mermaidTheme'
import { getHtmlExportBaseStyles } from '@/utils/htmlExportStylesBase'
import { getHtmlExportPrintStyles } from '@/utils/htmlExportStylesPrint'

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
      --code-syntax-comment: #c9d1d9;`
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
 * Returns inline CSS used by exported HTML documents.
 * @param colorMode - Selected markdown color mode.
 * @returns CSS text for the export document style tag.
 */
export function getHtmlExportStyles(colorMode: MermaidColorMode): string {
  const bodyColors =
    colorMode === 'dark'
      ? 'background-color: #0d1117; color: #f0f6fc;'
      : 'background-color: #ffffff; color: #24292f;'
  const mermaidTextColor = colorMode === 'dark' ? '#ffffff' : '#2a2a2a'
  const codeBlockVariables = getCodeBlockVariables(colorMode)
  const codeSyntaxVariables = getCodeSyntaxVariables(colorMode)

  const baseStyles = getHtmlExportBaseStyles({
    bodyColors,
    colorMode,
    codeBlockVariables,
    codeSyntaxVariables,
    mermaidTextColor,
  })

  return `${baseStyles}
${getHtmlExportPrintStyles()}`
}
