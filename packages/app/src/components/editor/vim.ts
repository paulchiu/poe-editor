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
    type: 'action' | 'operator' | 'motion',
    name: string,
    args?: Record<string, unknown>,
    extra?: Record<string, unknown>
  ) => void
  defineMotion: (
    name: string,
    fn: (
      cm: CodeMirrorAdapter,
      head: { line: number; ch: number },
      motionArgs: { repeat?: number; forward?: boolean }
    ) => { line: number; ch: number } | void
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

  // Override default moveByDisplayLines to use Monaco's native cursor movement
  // which correctly handles wrapped lines. This fixes gj/gk in both Normal and Visual modes.
  Vim.defineMotion('moveByDisplayLines', (cm, head, motionArgs) => {
    // Ensure the editor cursor is at the 'head' position before moving
    // Line/ch are 0-indexed in CM, 1-indexed in Monaco
    const startPos = { lineNumber: head.line + 1, column: head.ch + 1 }
    cm.editor.setPosition(startPos)

    const repeat = motionArgs.repeat || 1
    const command = motionArgs.forward ? 'cursorDown' : 'cursorUp'

    for (let i = 0; i < repeat; i++) {
        cm.editor.trigger('vim', command, {})
    }

    const newPos = cm.editor.getPosition()
    if (!newPos) return { line: head.line, ch: head.ch }
    
    return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
  })

  // Override default % motion to use Monaco's native jumpToBracket
  Vim.defineMotion('moveToMatchingBracket', (cm, head) => {
    const model = cm.editor.getModel()
    if (!model) return { line: head.line, ch: head.ch }

    const position = { lineNumber: head.line + 1, column: head.ch + 1 }
    const lineContent = model.getLineContent(position.lineNumber)

    // Check if the current line is a markdown code block fence
    // Matches ``` or ~~~ at the start of the line (allowing indentation)
    // We only trigger if the cursor is on the fence line
    const fenceRegex = /^\s*(`{3,}|~{3,})/
    const match = lineContent.match(fenceRegex)

    if (match) {
      const fence = match[1]
      const currentLine = position.lineNumber

      // Determine if this is a start or end fence
      // We do this by counting fences from the beginning of the file
      // If count (including current) is odd -> Start
      // If count (including current) is even -> End
      let fenceCount = 0
      for (let i = 1; i <= currentLine; i++) {
        const line = model.getLineContent(i)
        // We must match the exact same fence type (backticks vs tildes) logic
        // But simplified: any fence counts + we only care about parity
        // A robust parser would check nesting, but for markdown blocks usually top-level or consistently structured
        if (line.match(fenceRegex)) {
          fenceCount++
        }
      }

      const isStartFence = fenceCount % 2 !== 0
      let targetLine = -1

      if (isStartFence) {
        // Search downwards for the next matching fence
         for (let i = currentLine + 1; i <= model.getLineCount(); i++) {
            const line = model.getLineContent(i)
            // Ideally we match the exact fence length/char, but standard markdown parsers
            // usually just look for another fence. Let's look for any fence for simplicity
            // or we could be strict: line.startsWith(match[0])
            if (line.match(fenceRegex)) {
                targetLine = i
                break
            }
         }
      } else {
        // Search upwards for the previous matching fence
        for (let i = currentLine - 1; i >= 1; i--) {
            const line = model.getLineContent(i)
            if (line.match(fenceRegex)) {
                targetLine = i
                break
            }
        }
      }

      if (targetLine !== -1) {
        cm.editor.setPosition({ lineNumber: targetLine, column: 1 })
        // Return 0-indexed position for Vim
        return { line: targetLine - 1, ch: 0 }
      }
    }

    // Fallback to standard bracket jumping for non-fence lines
    cm.editor.setPosition(position)
    cm.editor.trigger('vim', 'editor.action.jumpToBracket', {})
    const newPos = cm.editor.getPosition()
    if (!newPos) return { line: head.line, ch: head.ch }
    return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
  })

  Vim.mapCommand('%', 'motion', 'moveToMatchingBracket')
}
