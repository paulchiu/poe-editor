import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { PipelineStep } from './types'
import { TransformerStep } from './TransformerStep'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/utils/classnames'

interface TransformerWorkbenchGuiPaneProps {
  setNodeRef: (element: HTMLElement | null) => void
  isOver: boolean
  steps: PipelineStep[]
  onUpdateStep: (id: string, config: Record<string, unknown>) => void
  onRemoveStep: (id: string) => void
  onToggleStep: (id: string) => void
  onAddRequest?: () => void
}

/**
 * Renders the drag-and-drop GUI mode for pipeline composition.
 * @param props - GUI mode state and handlers.
 * @returns GUI mode pane.
 */
export function TransformerWorkbenchGuiPane({
  setNodeRef,
  isOver,
  steps,
  onUpdateStep,
  onRemoveStep,
  onToggleStep,
  onAddRequest,
}: TransformerWorkbenchGuiPaneProps): ReactElement {
  return (
    <ScrollArea className="flex-1">
      <div
        ref={setNodeRef}
        className={cn('p-4 flex flex-col gap-3 min-h-[500px] transition-colors', isOver && 'bg-primary/5')}
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
  )
}
