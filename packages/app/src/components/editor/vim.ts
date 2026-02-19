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
}

// --- Helper Functions ---

const createYankSystemOperator =
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

const createPasteSystemAction =
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

const moveByDisplayLinesMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number },
  motionArgs: { repeat?: number; forward?: boolean }
) => {
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
}

const moveToMatchingBracketMotion = (
  cm: CodeMirrorAdapter,
  head: { line: number; ch: number }
) => {
  const model = cm.editor.getModel()
  if (!model) return { line: head.line, ch: head.ch }

  const position = { lineNumber: head.line + 1, column: head.ch + 1 }
  const lineContent = model.getLineContent(position.lineNumber)

  // 1. Try Markdown Fences
  const fenceTarget = findMarkdownFenceTarget(model, position, lineContent)
  if (fenceTarget) return fenceTarget

  // 2. Try Quotes
  const quoteTarget = findQuoteTarget(lineContent, head)
  if (quoteTarget) return quoteTarget

  // 3. Fallback to standard bracket jumping
  return findStandardBracketTarget(cm, position, head)
}

// --- Bracket/Fence/Quote Helpers ---

const findMarkdownFenceTarget = (
  model: editor.ITextModel,
  position: { lineNumber: number },
  lineContent: string
): { line: number; ch: number } | null => {
  const fenceRegex = /^\s*(`{3,}|~{3,})/
  const match = lineContent.match(fenceRegex)

  if (!match) return null

  // Determine if this is a start or end fence by counting fences from the beginning
  const fenceCount = countFencesUpToLine(model, position.lineNumber, fenceRegex)
  const isStartFence = fenceCount % 2 !== 0

  let targetLine = -1

  if (isStartFence) {
    targetLine = findNextFence(model, position.lineNumber + 1, fenceRegex)
  } else {
    targetLine = findPreviousFence(model, position.lineNumber - 1, fenceRegex)
  }

  if (targetLine !== -1) {
    // Return 0-indexed position for Vim
    return { line: targetLine - 1, ch: 0 }
  }

  return null
}

const countFencesUpToLine = (
  model: editor.ITextModel,
  lineNumber: number,
  fenceRegex: RegExp
): number => {
  let fenceCount = 0
  for (let i = 1; i <= lineNumber; i++) {
    const line = model.getLineContent(i)
    if (line.match(fenceRegex)) {
      fenceCount++
    }
  }
  return fenceCount
}

const findNextFence = (
  model: editor.ITextModel,
  startLine: number,
  fenceRegex: RegExp
): number => {
  for (let i = startLine; i <= model.getLineCount(); i++) {
    const line = model.getLineContent(i)
    if (line.match(fenceRegex)) {
      return i
    }
  }
  return -1
}

const findPreviousFence = (
  model: editor.ITextModel,
  startLine: number,
  fenceRegex: RegExp
): number => {
  for (let i = startLine; i >= 1; i--) {
    const line = model.getLineContent(i)
    if (line.match(fenceRegex)) {
      return i
    }
  }
  return -1
}

const findQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number }
): { line: number; ch: number } | null => {
  const char = lineContent[head.ch]
  const simpleQuotes = ["'", '"', '`']
  const smartQuotes = {
    '“': '”',
    '”': '“',
    '‘': '’',
    '’': '‘',
  } as const

  if (simpleQuotes.includes(char)) {
    return findSimpleQuoteTarget(lineContent, head, char)
  }

  if (char in smartQuotes) {
    return findSmartQuoteTarget(lineContent, head, char as keyof typeof smartQuotes, smartQuotes)
  }

  return null
}

const findSimpleQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number },
  char: string
): { line: number; ch: number } | null => {
  // Find all occurrences of this quote char on the line
  const positions: number[] = []
  for (let i = 0; i < lineContent.length; i++) {
    // Handle escaped quotes if not backtick
    if (lineContent[i] === char) {
      if (char !== '`' && i > 0 && lineContent[i - 1] === '\\') {
        continue
      }
      positions.push(i)
    }
  }

  const currentIndex = positions.indexOf(head.ch)
  if (currentIndex !== -1) {
    // If even index (0, 2, ..) -> Start quote -> Jump forward
    // If odd index (1, 3, ..) -> End quote -> Jump backward
    const targetIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1

    if (targetIndex >= 0 && targetIndex < positions.length) {
      return { line: head.line, ch: positions[targetIndex] }
    }
  }
  return null
}

const findSmartQuoteTarget = (
  lineContent: string,
  head: { line: number; ch: number },
  char: keyof typeof smartQuotes,
  smartQuotes: Record<string, string>
): { line: number; ch: number } | null => {
  const targetChar = smartQuotes[char]
  const isStart = ['“', '‘'].includes(char)

  let targetCol = -1
  if (isStart) {
    // Search forward
    targetCol = lineContent.indexOf(targetChar, head.ch + 1)
  } else {
    // Search backward
    targetCol = lineContent.lastIndexOf(targetChar, head.ch - 1)
  }

  if (targetCol !== -1) {
    return { line: head.line, ch: targetCol }
  }
  return null
}

const findStandardBracketTarget = (
  cm: CodeMirrorAdapter,
  position: { lineNumber: number; column: number },
  head: { line: number; ch: number }
): { line: number; ch: number } => {
  cm.editor.setPosition(position)
  cm.editor.trigger('vim', 'editor.action.jumpToBracket', {})
  const newPos = cm.editor.getPosition()
  if (!newPos) return { line: head.line, ch: head.ch }
  return { line: newPos.lineNumber - 1, ch: newPos.column - 1 }
}
