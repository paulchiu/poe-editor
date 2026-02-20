import { VimMode } from 'monaco-vim'
import type { CodeMirrorAdapter, VimModeModule } from './vimTypes'
import { createYankSystemOperator, createPasteSystemAction } from './vimClipboard'
import {
  moveByDisplayLinesMotion,
  moveToMatchingBracketMotion,
  moveToEndOfDisplayLineMotion,
} from './vimMotions'

// Setup clipboard integration for monaco-vim
// This needs to run only once to register the operators and actions globally
let vimClipboardSetup = false

/**
 * Initializes Vim mode for Monaco editor including custom operators and actions.
 * Registers clipboard operators, visual line movement, and bracket matching motions.
 * @returns {void}
 */
export function setupVim(): void {
  if (vimClipboardSetup || !VimMode) {
    return
  }
  vimClipboardSetup = true

  // VimMode is the CMAdapter class, and 'Vim' API is attached to it at runtime
  const { Vim } = VimMode as unknown as VimModeModule

  if (!Vim) {
    return
  }

  // Define yank to system clipboard operator
  Vim.defineOperator('yankSystem', createYankSystemOperator(Vim))

  // Define paste from system clipboard action
  Vim.defineAction('pasteSystem', createPasteSystemAction(Vim))

  // Define visual line movement actions
  Vim.defineAction('moveDownDisplay', (cm: CodeMirrorAdapter) => {
    cm.editor.trigger('vim', 'cursorDown', {})
  })

  Vim.defineAction('moveUpDisplay', (cm: CodeMirrorAdapter) => {
    cm.editor.trigger('vim', 'cursorUp', {})
  })

  // Register the internal paste command to a custom key
  Vim.mapCommand('<PasteTrigger>', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('<PasteTriggerBefore>', 'action', 'paste', { after: false, isEdit: true })

  // Remap y to yankSystem operator
  Vim.mapCommand('y', 'operator', 'yankSystem')
  // Remap Y to yankSystem (linewise)
  Vim.mapCommand(
    'Y',
    'operator',
    'yankSystem',
    { linewise: true },
    { type: 'operatorMotion', motion: 'expandToLine', motionArgs: { linewise: true } }
  )

  // Handle :set wrap and :set nowrap
  Vim.defineOption('wrap', true, 'boolean', [], (value, cm) => {
    if (cm && cm.editor) {
      cm.editor.updateOptions({
        wordWrap: value ? 'on' : 'off',
      })
    }
  })

  // Explicitly map p/P back to default 'paste' to ensure no stale 'pasteSystem' mapping remains
  // This fixes the popup issue by avoiding navigator.clipboard.readText() on 'p'
  Vim.mapCommand('p', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('P', 'action', 'paste', { after: false, isEdit: true })

  // Override default moveByDisplayLines to use Monaco's native cursor movement
  // which correctly handles wrapped lines. This fixes gj/gk in both Normal and Visual modes.
  Vim.defineMotion('moveByDisplayLines', moveByDisplayLinesMotion)

  // Override default % motion to use Monaco's native jumpToBracket
  Vim.defineMotion('moveToMatchingBracket', moveToMatchingBracketMotion)

  Vim.mapCommand('%', 'motion', 'moveToMatchingBracket')

  // Remap j/k to move by display lines (gj/gk) to handle wrapped lines intuitively
  Vim.mapCommand('j', 'motion', 'moveByDisplayLines', { forward: true })
  Vim.mapCommand('k', 'motion', 'moveByDisplayLines', { forward: false })

  // Override default g$ to use Monaco's native cursorEnd (end of display line)
  Vim.defineMotion('moveToEndOfDisplayLine', moveToEndOfDisplayLineMotion)
  Vim.mapCommand('g$', 'motion', 'moveToEndOfDisplayLine')

  // Override default g^/g0 to use Monaco's native cursorHome (start of display line)
  Vim.mapCommand('g^', 'motion', 'moveToStartOfDisplayLine')
  Vim.mapCommand('g0', 'motion', 'moveToStartOfDisplayLine')

  // Register spell check option
  // We use a custom event to notify React when Vim changes this option
  Vim.defineOption(
    'spell',
    false,
    'boolean',
    [],
    (value: string | number | boolean | undefined) => {
      // Notify subscribers
      if (typeof value === 'boolean') {
        spellCheckSubscribers.forEach((cb) => cb(value))
      }
    }
  )
}

// Subscription mechanism for spell check changes from Vim
type SpellCheckCallback = (enabled: boolean) => void
const spellCheckSubscribers: SpellCheckCallback[] = []

export function onVimSpellCheckChange(callback: SpellCheckCallback): () => void {
  spellCheckSubscribers.push(callback)
  return () => {
    const index = spellCheckSubscribers.indexOf(callback)
    if (index > -1) {
      spellCheckSubscribers.splice(index, 1)
    }
  }
}
