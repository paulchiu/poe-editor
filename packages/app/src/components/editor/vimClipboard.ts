import { toast } from '@/hooks/useToast'
import type { VimAPI, CodeMirrorAdapter, VimOperatorArgs } from './vimTypes'

interface VimCursor {
  line: number
  ch: number
}

interface VimRange {
  anchor: VimCursor
  head: VimCursor
}

const isVimCursor = (value: unknown): value is VimCursor => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<VimCursor>
  return typeof candidate.line === 'number' && typeof candidate.ch === 'number'
}

const isVimRange = (value: unknown): value is VimRange => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<VimRange>
  return isVimCursor(candidate.anchor) && isVimCursor(candidate.head)
}

const isVimRangeArray = (value: unknown): value is VimRange[] => {
  return Array.isArray(value) && value.every(isVimRange)
}

const compareCursors = (left: VimCursor, right: VimCursor): number => {
  if (left.line !== right.line) {
    return left.line - right.line
  }
  return left.ch - right.ch
}

const getVisualYankCursor = (
  cm: CodeMirrorAdapter,
  ranges: unknown,
  oldAnchor: unknown
): VimCursor | unknown => {
  const selAnchor = cm.state.vim.sel?.anchor
  const selHead = cm.state.vim.sel?.head
  if (
    !cm.state.vim.visualMode ||
    !isVimCursor(selAnchor) ||
    !isVimCursor(selHead) ||
    !isVimRangeArray(ranges) ||
    ranges.length === 0
  ) {
    return oldAnchor
  }

  const [firstRange] = ranges
  const cursors = [selAnchor, selHead, firstRange.anchor, firstRange.head]
  return cursors.reduce((minimum, current) =>
    compareCursors(current, minimum) < 0 ? current : minimum
  )
}

/**
 * Creates a yank operator that copies selected text to the system clipboard.
 * @param Vim - The Vim API instance for register access
 * @returns An operator function compatible with Vim.defineOperator
 */
export const createYankSystemOperator =
  (Vim: VimAPI) =>
  (cm: CodeMirrorAdapter, args: VimOperatorArgs, ranges: unknown, oldAnchor: unknown) => {
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
    return getVisualYankCursor(cm, ranges, oldAnchor)
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
