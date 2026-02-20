import type { editor } from 'monaco-editor'

/**
 * Builds the Monaco editor options configuration.
 *
 * @param showLineNumbers - Whether to display line numbers
 * @returns Monaco editor options object
 */
export function buildEditorOptions(
  showLineNumbers: boolean
): editor.IStandaloneEditorConstructionOptions {
  return {
    wordWrap: 'on',
    minimap: { enabled: false },
    lineNumbers: showLineNumbers ? 'on' : 'off',
    fontSize: 14,
    lineHeight: 22,
    fontFamily:
      "'JetBrains Mono', 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
    fontLigatures: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    smoothScrolling: false,
    unicodeHighlight: {
      ambiguousCharacters: false,
    },
  }
}
