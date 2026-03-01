import type { ReactElement, RefObject } from 'react'
import { AlertTriangle } from 'lucide-react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { cn } from '@/utils/classnames'

interface TransformerWorkbenchJsonPaneProps {
  setNodeRef: (element: HTMLElement | null) => void
  isOver: boolean
  jsonValue: string
  onJsonChange: (value: string | undefined) => void
  onEditorMount: OnMount
  theme: 'light' | 'dark'
  isValidJson: boolean
  validationError: string | null
  vimMode?: boolean
  statusBarRef: RefObject<HTMLDivElement | null>
}

/**
 * Renders the JSON editor mode for the transformer workbench.
 * @param props - JSON editor state and handlers.
 * @returns JSON mode pane.
 */
export function TransformerWorkbenchJsonPane({
  setNodeRef,
  isOver,
  jsonValue,
  onJsonChange,
  onEditorMount,
  theme,
  isValidJson,
  validationError,
  vimMode,
  statusBarRef,
}: TransformerWorkbenchJsonPaneProps): ReactElement {
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 relative min-h-0 flex flex-col transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/20 ring-inset'
      )}
    >
      <div className="flex-1">
        <Editor
          height="100%"
          language="json"
          value={jsonValue}
          onChange={onJsonChange}
          onMount={onEditorMount}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      <div className="flex flex-col shrink-0">
        {!isValidJson && (
          <div className="bg-destructive/10 text-destructive text-xs p-2 border-t border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{validationError || 'Invalid JSON'}</span>
          </div>
        )}
        {vimMode && (
          <div
            ref={statusBarRef}
            className="vim-status-bar h-6 border-t border-border bg-background font-mono text-xs flex items-center overflow-hidden px-2"
            style={{
              fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace",
            }}
          />
        )}
      </div>
    </div>
  )
}
