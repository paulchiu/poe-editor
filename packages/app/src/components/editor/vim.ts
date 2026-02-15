import { VimMode } from 'monaco-vim'
import type { editor } from 'monaco-editor'
import { toast } from '@/hooks/useToast'

// Setup clipboard integration for monaco-vim
// This needs to run only once to register the operators and actions globally
let vimClipboardSetup = false

interface VimRegisterController {
  pushText: (
    register: string,
    type: string,
    text: string,
    linewise: boolean,
    blockwise: boolean
  ) => void
}

interface VimState {
  vim: {
    visualBlock: boolean
  }
}

interface CodeMirrorAdapter {
  getSelection: () => string
  state: VimState
  readonly editor: editor.IStandaloneCodeEditor
}

interface VimOperatorArgs {
  registerName: string
  linewise: boolean
  after?: boolean
}

interface VimAPI {
  defineOperator: (
    name: string,
    fn: (
      cm: CodeMirrorAdapter,
      args: VimOperatorArgs,
      ranges: unknown,
      oldAnchor: unknown
    ) => unknown
  ) => void
  defineAction: (
    name: string,
    fn: (cm: CodeMirrorAdapter, args: VimOperatorArgs) => Promise<void> | void
  ) => void
  getRegisterController: () => VimRegisterController
  handleKey: (cm: CodeMirrorAdapter, key: string) => void
  mapCommand: (
    command: string,
    type: 'action' | 'operator',
    name: string,
    args?: Record<string, unknown>,
    extra?: Record<string, unknown>
  ) => void
}

interface VimModeModule {
  Vim: VimAPI
}

/**
 * Initializes Vim mode for Monaco editor including custom operators and actions
 */
export function setupVim() {
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
  Vim.defineOperator(
    'yankSystem',
    (cm: CodeMirrorAdapter, args: VimOperatorArgs, _ranges: unknown, oldAnchor: unknown) => {
      const text = cm.getSelection()
      if (text) {
        navigator.clipboard.writeText(text).catch(() => {
          toast({
            description: 'Failed to write to system clipboard',
            variant: 'destructive',
          })
        })

        // Update internal register for consistency so 'p' works internally
        Vim.getRegisterController().pushText(
          args.registerName,
          'yank',
          text,
          args.linewise,
          cm.state.vim.visualBlock
        )
      }
      return oldAnchor
    }
  )

  // Define paste from system clipboard action
  Vim.defineAction('pasteSystem', async (cm: CodeMirrorAdapter, args: VimOperatorArgs) => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const linewise = text.indexOf('\n') !== -1 && (text.endsWith('\n') || text.endsWith('\r\n'))

        // Push to " register
        Vim.getRegisterController().pushText('"', 'yank', text, linewise, false)

        // Trigger the internal paste action using a mapped key
        if (args.after) {
          Vim.handleKey(cm, '<PasteTrigger>')
        } else {
          Vim.handleKey(cm, '<PasteTriggerBefore>')
        }
      }
    } catch {
      toast({
        description: 'Failed to read from system clipboard',
        variant: 'destructive',
      })
    }
  })

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

  // Explicitly map p/P back to default 'paste' to ensure no stale 'pasteSystem' mapping remains
  // This fixes the popup issue by avoiding navigator.clipboard.readText() on 'p'
  Vim.mapCommand('p', 'action', 'paste', { after: true, isEdit: true })
  Vim.mapCommand('P', 'action', 'paste', { after: false, isEdit: true })

  // Map gj/gk to visual line movement
  Vim.mapCommand('gj', 'action', 'moveDownDisplay', {})
  Vim.mapCommand('gk', 'action', 'moveUpDisplay', {})
}
