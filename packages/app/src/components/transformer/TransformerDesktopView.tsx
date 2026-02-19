import type { ReactElement } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { TransformerToolbox } from './TransformerToolbox'
import { TransformerWorkbench } from './TransformerWorkbench'
import { TransformerPreview } from './TransformerPreview'
import type { PipelineStep, TransformationPipeline, TransformerOperation } from './types'

interface TransformerDesktopViewProps {
  steps: PipelineStep[]
  onSetSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>
  onUpdateStep: (id: string, config: Record<string, unknown>) => void
  onRemoveStep: (id: string) => void
  onToggleStep: (id: string) => void
  onAddOperation: (operation: TransformerOperation) => void
  currentPipeline: TransformationPipeline
  initialPreviewText?: string
  vimMode?: boolean
}

/**
 * Desktop layout for the transformer dialog with resizable three-panel view.
 * @param props - Component props
 * @returns Desktop view component
 */
export function TransformerDesktopView({
  steps,
  onSetSteps,
  onUpdateStep,
  onRemoveStep,
  onToggleStep,
  onAddOperation,
  currentPipeline,
  initialPreviewText,
  vimMode,
}: TransformerDesktopViewProps): ReactElement {
  return (
    <div className="flex-1 overflow-hidden h-full">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full overflow-y-auto bg-muted/5">
            <TransformerToolbox onAddStep={onAddOperation} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-y-auto bg-background/50">
            <TransformerWorkbench
              steps={steps}
              onSetSteps={onSetSteps}
              onUpdateStep={onUpdateStep}
              onRemoveStep={onRemoveStep}
              onToggleStep={onToggleStep}
              onAddOperation={onAddOperation}
              vimMode={vimMode}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full overflow-y-auto">
            <TransformerPreview pipeline={currentPipeline} initialText={initialPreviewText} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
