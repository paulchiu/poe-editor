import type { editor } from 'monaco-editor'

const displayLineStateByEditor = new WeakMap<editor.IStandaloneCodeEditor, boolean>()

/**
 * Stores whether Vim line-boundary motions should follow wrapped display lines for an editor.
 * @param editorInstance - Monaco editor instance.
 * @param enabled - True when display-line boundary motions are enabled.
 * @returns void
 */
export function setDisplayLineEnabledForEditor(
  editorInstance: editor.IStandaloneCodeEditor,
  enabled: boolean
): void {
  displayLineStateByEditor.set(editorInstance, enabled)
}

/**
 * Reads whether Vim line-boundary motions follow wrapped display lines for an editor.
 * @param editorInstance - Monaco editor instance.
 * @returns True when display-line boundary motions are enabled, otherwise false.
 */
export function isDisplayLineEnabledForEditor(
  editorInstance: editor.IStandaloneCodeEditor
): boolean {
  return displayLineStateByEditor.get(editorInstance) ?? false
}

/**
 * Clears display-line motion state for an editor instance.
 * @param editorInstance - Monaco editor instance.
 * @returns void
 */
export function clearDisplayLineEnabledForEditor(
  editorInstance: editor.IStandaloneCodeEditor
): void {
  displayLineStateByEditor.delete(editorInstance)
}
