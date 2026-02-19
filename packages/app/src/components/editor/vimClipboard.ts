import { toast } from '@/hooks/useToast'
import type { VimAPI, CodeMirrorAdapter, VimOperatorArgs } from './vimTypes'

/**
 * Creates a yank operator that copies selected text to the system clipboard.
 * @param Vim - The Vim API instance for register access
 * @returns An operator function compatible with Vim.defineOperator
 */
export const createYankSystemOperator =
  (Vim: VimAPI) =>
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

/**
 * Creates a paste action that reads text from the system clipboard.
 * @param Vim - The Vim API instance for register and key handling
 * @returns An action function compatible with Vim.defineAction
 */
export const createPasteSystemAction =
  (Vim: VimAPI) => async (cm: CodeMirrorAdapter, args: VimOperatorArgs) => {
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
  }
