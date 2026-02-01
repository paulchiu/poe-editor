import { useRef, type ReactElement } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { TransformerStep } from './TransformerStep'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { PipelineStep, TransformerOperation } from './types'

interface TransformerWorkbenchProps {
  steps: PipelineStep[]
  onUpdateStep: (id: string, config: Record<string, unknown>) => void
  onRemoveStep: (id: string) => void
  onToggleStep: (id: string) => void
  onMoveStep: (dragIndex: number, hoverIndex: number) => void
  onAddOperation: (operation: TransformerOperation) => void
}

/**
 * Workbench for building transformation pipelines with drag-and-drop interface.
 * @param props - Component props
 * @returns Transformer workbench component
 */
export function TransformerWorkbench({
  steps,
  onUpdateStep,
  onRemoveStep,
  onToggleStep,
  onMoveStep,
  onAddOperation,
}: TransformerWorkbenchProps): ReactElement {
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
  }

  const handleDragEnd = () => {
    const dragIndex = dragItem.current
    const hoverIndex = dragOverItem.current

    if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
      onMoveStep(dragIndex, hoverIndex)
    }

    dragItem.current = null
    dragOverItem.current = null
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const operation = JSON.parse(data) as TransformerOperation
        if (operation.id) {
          onAddOperation(operation)
        }
      }
    } catch {
      // Silently ignore invalid drop data - user will try again or use toolbar
    }
  }

  return (
    <div
      className="flex flex-col h-full bg-muted/5 relative"
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b bg-background flex justify-between items-center">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Pipeline
          <span className="text-xs font-normal normal-case bg-muted px-2 py-0.5 rounded-full text-foreground">
            {steps.length} steps
          </span>
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-3 min-h-[500px]">
          {steps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 text-center p-8 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-foreground mb-1">Build your pipeline</h4>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Drag items from the toolbox on the left to start building.
              </p>
            </div>
          ) : (
            steps.map((step, index) => (
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
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
