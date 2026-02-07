import { type ReactElement, useState, useRef, useEffect } from 'react'
import { Plus, Sparkles, Code, FileJson, AlertTriangle } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import { initVimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { TransformerStep } from './TransformerStep'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PipelineStep, TransformerOperation } from './types'
import { PipelineStepsArraySchema } from './toolbarSchema'
import { cn } from '@/utils/classnames'
import { toast } from 'sonner'
import { z } from 'zod'

interface TransformerWorkbenchProps {
  steps: PipelineStep[]
  onSetSteps?: (steps: PipelineStep[]) => void
  onUpdateStep: (id: string, config: Record<string, unknown>) => void
  onRemoveStep: (id: string) => void
  onToggleStep: (id: string) => void
  onAddOperation?: (operation: TransformerOperation) => void
  onAddRequest?: () => void
  vimMode?: boolean
}

/**
 * Workbench for building transformation pipelines with drag-and-drop interface.
 * @param props - Component props
 * @returns Transformer workbench component
 */
export function TransformerWorkbench({
  steps,
  onSetSteps,
  onUpdateStep,
  onRemoveStep,
  onToggleStep,
  onAddRequest,
  vimMode,
}: TransformerWorkbenchProps): ReactElement {
  const { resolvedTheme } = useTheme()
  const [mode, setMode] = useState<'gui' | 'json'>('gui')
  const [jsonValue, setJsonValue] = useState('')
  const [isValidJson, setIsValidJson] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const vimInstanceRef = useRef<VimAdapter | null>(null)
  const statusBarRef = useRef<HTMLDivElement | null>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: 'workbench-container',
    // Enable drop in JSON mode too so we can detect when an item is dropped
    disabled: false,
  })

  // Track previous steps to detect additions
  const prevStepsRef = useRef<PipelineStep[]>(steps)
  const cursorPositionRef = useRef<number>(0) // Track line number

  // Sync steps to JSON when opening JSON mode or when steps change while in JSON mode (optional, but good for keeping sync)
  useEffect(() => {
    if (mode === 'gui') {
      setJsonValue(JSON.stringify(steps, null, 2))
      setIsValidJson(true)
      setValidationError(null)
    } else {
      // In JSON mode, if steps changed, it might be due to an add operation from the toolbox
      const prevSteps = prevStepsRef.current
      if (steps.length > prevSteps.length) {
        // Find added steps
        const addedSteps = steps.filter((s) => !prevSteps.find((p) => p.id === s.id))

        if (addedSteps.length > 0) {
          let newJsonValue = jsonValue

          try {
            // Try to parse current JSON
            const currentContent = jsonValue.trim()
            let stepsArray: unknown[] = []

            if (currentContent && isValidJson) {
              stepsArray = JSON.parse(currentContent)
              if (!Array.isArray(stepsArray)) {
                throw new Error('Not an array')
              }

              // Determine insertion index based on cursor line
              // We need to find which object in the array the cursor is over or after
              // This is a bit tricky with just JSON.parse.
              // We can estimate by looking at the JSON string structure or just use the end if not sure.
              // A simple heuristic: find the index of the object that ends before the cursor line

              const cursorLine = cursorPositionRef.current

              // Re-serialize to find line numbers of items (approximate)
              // This is expensive but accurate enough for small pipelines
              // Or better: we can't easily map lines to array indices without AST.
              // Let's use a simpler approach:
              // If we are adding 1 item, find where to put it.

              let insertIndex = stepsArray.length // Default to end

              if (cursorLine > 0 && editorRef.current) {
                // Get the model to find offsets
                const model = editorRef.current.getModel()
                if (model) {
                  const cursorOffset = model.getOffsetAt({ lineNumber: cursorLine, column: 1 })

                  // Find the array item that starts after this offset
                  // We need to tokenize or regex find the start of objects.
                  // Let's try to match `{` at top level.
                  // This is getting complex for a simple JSON editor.

                  // Simplified approach:
                  // 1. Split by `},` to approximate items? No, fragile.
                  // 2. Just count how many `{` at depth 1 are before the cursor?

                  // Refined logic: itemsPassed is "number of closed items before cursor".
                  // So if we are after item 0 (closed) and before item 1, index is 1.
                  // insertIndex = itemsPassed
                  // User wants to insert *after* cursor's containing block or position.
                  // So we count how many items have *started* before cursor.

                  let depth = 0
                  let itemsStarted = 0
                  let inString = false
                  let escape = false

                  for (let i = 0; i < cursorOffset && i < currentContent.length; i++) {
                    const char = currentContent[i]

                    if (escape) {
                      escape = false
                      continue
                    }

                    if (char === '\\') {
                      escape = true
                      continue
                    }

                    if (char === '"') {
                      inString = !inString
                      continue
                    }

                    if (!inString) {
                      if (char === '{') {
                        if (depth === 1) {
                          // Starting a top level item
                          itemsStarted++
                        }
                        depth++
                      } else if (char === '}') {
                        depth--
                      } else if (char === '[') {
                        depth++
                      } else if (char === ']') {
                        depth--
                      }
                    }
                  }

                  insertIndex = itemsStarted

                  // Special check: are we inside the last item but it's not closed?
                  // Then itemsPassed is length-1. We should insert at length (after).
                  // Actually if we are inside, we probably shouldn't break the JSON.
                  // But we are reconstructing the array, so we just decide the order.

                  // If cursor is at start `[ | {`, itemsPassed = 0. Insert at 0. Correct.
                  // If cursor is `[ {}, | {} ]`, itemsPassed = 1. Insert at 1. Correct.
                  // If cursor is `[ {}, {} | ]`, itemsPassed = 2. Insert at 2. Correct.
                }
              }

              // Ensure index is within bounds
              if (insertIndex < 0) insertIndex = 0
              if (insertIndex > stepsArray.length) insertIndex = stepsArray.length

              // Insert
              stepsArray.splice(insertIndex, 0, ...addedSteps)

              newJsonValue = JSON.stringify(stepsArray, null, 2)
              setIsValidJson(true)
              setValidationError(null)
            } else if (!currentContent) {
              // Empty content
              stepsArray = []
              stepsArray.push(...addedSteps)
              newJsonValue = JSON.stringify(stepsArray, null, 2)
            } else {
              throw new Error('Invalid JSON')
            }
          } catch {
            // Fallback for invalid JSON: Insert at cursor position directly as string
            const addedJson = addedSteps.map((s) => JSON.stringify(s, null, 2)).join(',\n')
            const cursorLine = cursorPositionRef.current

            if (cursorLine > 0 && editorRef.current) {
              const model = editorRef.current.getModel()
              if (model) {
                const cursorOffset = model.getOffsetAt({ lineNumber: cursorLine, column: 1 })

                const prefix = jsonValue.substring(0, cursorOffset)
                const suffix = jsonValue.substring(cursorOffset)

                // Best effort comma handling
                const needsCommaBefore =
                  prefix.trim().endsWith('}') ||
                  prefix.trim().endsWith(']') ||
                  prefix.trim().endsWith('"')
                const needsCommaAfter =
                  suffix.trim().startsWith('{') || suffix.trim().startsWith('"')

                newJsonValue = `${prefix}${needsCommaBefore ? ',' : ''}\n${addedJson}${needsCommaAfter ? ',' : ''}\n${suffix}`
                setJsonValue(newJsonValue)
                return // Early return to avoid overwritting
              }
            }

            // Fallback to append if no cursor info or update failed
            // Simple heuristic to try to insert before the last closing bracket if it looks like an array
            const trimmed = jsonValue.trim()
            if (trimmed.endsWith(']')) {
              const lastBracketIndex = jsonValue.lastIndexOf(']')
              const prefix = jsonValue.substring(0, lastBracketIndex)
              const suffix = jsonValue.substring(lastBracketIndex)

              // Add comma if there seems to be content before
              const needsComma =
                prefix.trim().endsWith('}') ||
                prefix.trim().endsWith(']') ||
                prefix.trim().endsWith('"') ||
                prefix.trim().match(/\d$/)

              newJsonValue = `${prefix}${needsComma ? ',' : ''}\n${addedJson}\n${suffix}`
            } else {
              // Just append
              newJsonValue = `${jsonValue}\n${addedJson}`
            }
          }

          setJsonValue(newJsonValue)
        }
      }
    }

    // Update ref
    prevStepsRef.current = steps
  }, [steps, mode, isValidJson, jsonValue])

  // Handle vim mode initialization on mode/prop change
  useEffect(() => {
    // Initialize Vim mode
    const initVim = () => {
      if (
        mode !== 'json' ||
        !vimMode ||
        !editorRef.current ||
        !statusBarRef.current ||
        vimInstanceRef.current
      ) {
        return
      }

      try {
        vimInstanceRef.current = initVimMode(editorRef.current, statusBarRef.current)
      } catch {
        // Silently handle vim initialization errors
      }
    }

    if (mode === 'json' && vimMode) {
      // Small delay to ensure status bar is rendered
      const timer = setTimeout(initVim, 0)
      return () => clearTimeout(timer)
    }

    // Cleanup
    if (vimInstanceRef.current) {
      vimInstanceRef.current.dispose()
      vimInstanceRef.current = null
    }
  }, [mode, vimMode])

  const handleModeToggle = () => {
    if (mode === 'gui') {
      // Switching to JSON
      setJsonValue(JSON.stringify(steps, null, 2))
      setMode('json')
    } else {
      // Switching to GUI
      if (!isValidJson) {
        toast.error('Cannot switch to GUI mode with invalid JSON')
        return
      }

      try {
        const parsed = JSON.parse(jsonValue)
        const validated = PipelineStepsArraySchema.parse(parsed)

        if (onSetSteps) {
          onSetSteps(validated)
          setMode('gui')
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = `Validation error: ${error.issues.map((i) => i.message).join(', ')}`
          setValidationError(message)
          toast.error(message)
        } else {
          setValidationError('Invalid JSON format')
          toast.error('Invalid JSON format')
        }
        setIsValidJson(false)
      }
    }
  }

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      cursorPositionRef.current = e.position.lineNumber
    })
  }

  const handleJsonChange = (value: string | undefined) => {
    const newValue = value || ''
    setJsonValue(newValue)

    try {
      const parsed = JSON.parse(newValue)
      const result = PipelineStepsArraySchema.safeParse(parsed)

      if (result.success) {
        setIsValidJson(true)
        setValidationError(null)
      } else {
        setIsValidJson(false)
        setValidationError('Schema validation failed')
      }
    } catch {
      setIsValidJson(false)
      setValidationError('Invalid JSON syntax')
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/5 relative">
      <div className="p-4 border-b bg-background flex justify-between items-center shrink-0">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Pipeline
          <span className="text-xs font-normal normal-case bg-muted px-2 py-0.5 rounded-full text-foreground">
            {steps.length} steps
          </span>
        </h3>

        {onSetSteps && (
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  {' '}
                  {/* Wrapper to allow tooltip on 'disabled' style button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleModeToggle}
                    className={cn(
                      'h-8 w-8',
                      mode === 'json'
                        ? !isValidJson
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'text-muted-foreground'
                    )}
                  >
                    {mode === 'gui' ? (
                      <FileJson className="w-4 h-4" />
                    ) : (
                      <Code className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {mode === 'gui'
                  ? 'Edit as JSON'
                  : !isValidJson
                    ? 'Fix schema errors to switch view'
                    : 'Switch to GUI'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {mode === 'json' ? (
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
              onChange={handleJsonChange}
              onMount={handleEditorDidMount}
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
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
      ) : (
        <ScrollArea className="flex-1">
          <div
            ref={setNodeRef}
            className={cn(
              'p-4 flex flex-col gap-3 min-h-[500px] transition-colors',
              isOver && 'bg-primary/5'
            )}
          >
            {steps.length === 0 ? (
              <div
                className={cn(
                  'flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 text-center p-8 transition-colors',
                  onAddRequest ? 'hover:border-primary/40 hover:bg-primary/5 cursor-pointer' : ''
                )}
                onClick={onAddRequest}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-foreground mb-1">Build your pipeline</h4>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  {onAddRequest
                    ? 'Tap here to add your first step.'
                    : 'Drag items from the toolbox on the left to start building.'}
                </p>
              </div>
            ) : (
              <SortableContext items={steps} strategy={verticalListSortingStrategy}>
                {steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-border -ml-px z-0" />
                    )}

                    <TransformerStep
                      step={step}
                      index={index}
                      onUpdate={onUpdateStep}
                      onRemove={onRemoveStep}
                      onToggle={onToggleStep}
                    />
                  </div>
                ))}
              </SortableContext>
            )}
            {steps.length > 0 && onAddRequest && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onAddRequest}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
