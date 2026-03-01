import { VimMode } from 'monaco-vim'
import type { CodeMirrorAdapter, VimModeModule } from './vimTypes'
import { createYankSystemOperator, createPasteSystemAction } from './vimClipboard'
import {
  moveByConfigurableLinesMotion,
  moveByDisplayLinesMotion,
  moveByMarkdownParagraphMotion,
  moveByLogicalLinesMotion,
  moveToEndOfConfigurableLineMotion,
  moveToEndOfDisplayLineMotion,
  moveToHighDocumentPositionMotion,
  moveToLowDocumentPositionMotion,
  moveToMatchingBracketMotion,
  moveToMiddleDocumentPositionMotion,
  moveToRelativeLineStartMotion,
  moveToStartOfConfigurableLineMotion,
  moveToStartOfDisplayLineMotion,
  moveToFirstNonWhitespaceConfigurableLineMotion,
} from './vimMotions'
import { setDisplayLineEnabledForEditor } from './vimDisplayLine'

// Setup clipboard integration for monaco-vim
// This needs to run only once to register the operators and actions globally
let vimClipboardSetup = false

const resolveVimApi = (): VimModeModule['Vim'] | null => {
  if (!VimMode) {
    return null
  }

  const { Vim } = VimMode as unknown as VimModeModule
  return Vim || null
}

/**
 * Applies the Vim displayline option to a specific Vim adapter instance.
 * Keeps monaco-vim option state and custom motion state in sync.
 * @param cm - The active monaco-vim CodeMirror adapter instance
 * @param enabled - True to enable display-line boundaries for 0/^/$
 * @returns void
 */
export function setVimDisplayLineOption(cm: CodeMirrorAdapter, enabled: boolean): void {
  setDisplayLineEnabledForEditor(cm.editor, enabled)

  const Vim = resolveVimApi()
  Vim?.setOption?.('displayline', enabled, cm)
}

/**
 * Initializes Vim mode for Monaco editor including custom operators and actions.
 * Registers clipboard operators, wrapped-line motions, and markdown-aware movement overrides.
 * @returns {void}
 */
export function setupVim(): void {
  if (vimClipboardSetup) {
    return
  }

  const Vim = resolveVimApi()
  if (!Vim) {
    return
  }

  vimClipboardSetup = true

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

  Vim.defineAction('centerCursorLine', (cm: CodeMirrorAdapter) => {
    const position = cm.editor.getPosition()
    if (!position) {
      return
    }

    cm.editor.revealLineInCenter(position.lineNumber)
  })

  Vim.defineAction('jumpBackCursorHistory', (cm: CodeMirrorAdapter) => {
    cm.editor.trigger('vim', 'cursorUndo', {})
    const position = cm.editor.getPosition()
    if (position) {
      cm.editor.revealLineInCenterIfOutsideViewport(position.lineNumber)
    }
  })

  Vim.defineAction('jumpForwardCursorHistory', (cm: CodeMirrorAdapter) => {
    cm.editor.trigger('vim', 'cursorRedo', {})
    const position = cm.editor.getPosition()
    if (position) {
      cm.editor.revealLineInCenterIfOutsideViewport(position.lineNumber)
    }
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

  // Handle :set displayline and :set nodisplayline
  Vim.defineOption('displayline', false, 'boolean', [], (value, cm) => {
    if (cm && cm.editor && typeof value === 'boolean') {
      setDisplayLineEnabledForEditor(cm.editor, value)
    }
  })

  // Explicitly map p/P back to default 'paste' to ensure no stale 'pasteSystem' mapping remains
  // This fixes the popup issue by avoiding navigator.clipboard.readText() on 'p'
  Vim.mapCommand('p', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('P', 'action', 'paste', { after: false, isEdit: true })

  // Override default moveByDisplayLines to use Monaco's native cursor movement
  // which correctly handles wrapped lines.
  Vim.defineMotion('moveByDisplayLines', moveByDisplayLinesMotion)
  Vim.defineMotion('moveByLogicalLines', moveByLogicalLinesMotion)
  Vim.defineMotion('moveByConfigurableLines', moveByConfigurableLinesMotion)

  // Override default % motion to use Monaco's native jumpToBracket
  Vim.defineMotion('moveToMatchingBracket', moveToMatchingBracketMotion)
  Vim.mapCommand('%', 'motion', 'moveToMatchingBracket')

  // Remap j/k to follow displayline setting, and keep gj/gk explicitly display-line.
  Vim.mapCommand('j', 'motion', 'moveByConfigurableLines', { forward: true })
  Vim.mapCommand('k', 'motion', 'moveByConfigurableLines', { forward: false })
  Vim.mapCommand('gj', 'motion', 'moveByDisplayLines', { forward: true })
  Vim.mapCommand('gk', 'motion', 'moveByDisplayLines', { forward: false })

  // Register line boundary motions
  Vim.defineMotion('moveToStartOfDisplayLine', moveToStartOfDisplayLineMotion)
  Vim.defineMotion('moveToEndOfDisplayLine', moveToEndOfDisplayLineMotion)
  Vim.defineMotion('moveToStartOfConfigurableLine', moveToStartOfConfigurableLineMotion)
  Vim.defineMotion(
    'moveToFirstNonWhitespaceConfigurableLine',
    moveToFirstNonWhitespaceConfigurableLineMotion
  )
  Vim.defineMotion('moveToEndOfConfigurableLine', moveToEndOfConfigurableLineMotion)

  Vim.mapCommand('0', 'motion', 'moveToStartOfConfigurableLine')
  Vim.mapCommand('^', 'motion', 'moveToFirstNonWhitespaceConfigurableLine')
  Vim.mapCommand('$', 'motion', 'moveToEndOfConfigurableLine')

  Vim.mapCommand('g$', 'motion', 'moveToEndOfDisplayLine')
  Vim.mapCommand('g^', 'motion', 'moveToStartOfDisplayLine')
  Vim.mapCommand('g0', 'motion', 'moveToStartOfDisplayLine')

  // Register line-relative motions (+/-/_) to move by logical lines and land on first non-blank.
  Vim.defineMotion('moveToRelativeLineStart', moveToRelativeLineStartMotion)
  Vim.mapCommand('+', 'motion', 'moveToRelativeLineStart', { direction: 1 })
  Vim.mapCommand('-', 'motion', 'moveToRelativeLineStart', { direction: -1 })
  Vim.mapCommand('_', 'motion', 'moveToRelativeLineStart', { anchorCurrent: true })

  // Register markdown-aware paragraph movement.
  Vim.defineMotion('moveByMarkdownParagraph', moveByMarkdownParagraphMotion)
  Vim.mapCommand('{', 'motion', 'moveByMarkdownParagraph', { forward: false })
  Vim.mapCommand('}', 'motion', 'moveByMarkdownParagraph', { forward: true })

  Vim.mapCommand('<C-o>', 'action', 'jumpBackCursorHistory')
  Vim.mapCommand('<C-i>', 'action', 'jumpForwardCursorHistory')
  Vim.mapCommand('zz', 'action', 'centerCursorLine')

  // Override H/M/L to ensure reliable high/middle/low line jumps with Monaco viewport behavior
  Vim.defineMotion('moveToHighDocumentPosition', moveToHighDocumentPositionMotion)
  Vim.defineMotion('moveToMiddleDocumentPosition', moveToMiddleDocumentPositionMotion)
  Vim.defineMotion('moveToLowDocumentPosition', moveToLowDocumentPositionMotion)
  Vim.mapCommand('H', 'motion', 'moveToHighDocumentPosition')
  Vim.mapCommand('M', 'motion', 'moveToMiddleDocumentPosition')
  Vim.mapCommand('L', 'motion', 'moveToLowDocumentPosition')

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

/**
 * Subscribes to Vim :set spell and :set nospell changes.
 * @param callback - Callback invoked with the new spell-check state.
 * @returns Unsubscribe function.
 */
export function onVimSpellCheckChange(callback: SpellCheckCallback): () => void {
  spellCheckSubscribers.push(callback)
  return () => {
    const index = spellCheckSubscribers.indexOf(callback)
    if (index > -1) {
      spellCheckSubscribers.splice(index, 1)
    }
  }
}
