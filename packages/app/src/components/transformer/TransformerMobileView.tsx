import type { ReactElement } from 'react'
import { X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TransformerToolbox } from './TransformerToolbox'
import { TransformerWorkbench } from './TransformerWorkbench'
import { TransformerPreview } from './TransformerPreview'
import type { PipelineStep, TransformationPipeline, TransformerOperation } from './types'

interface TransformerMobileViewProps {
  activeTab: string
  onActiveTabChange: (tab: string) => void
  steps: PipelineStep[]
  onSetSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>
  onUpdateStep: (id: string, config: Record<string, unknown>) => void
  onRemoveStep: (id: string) => void
  onToggleStep: (id: string) => void
  onAddOperation: (operation: TransformerOperation) => void
  isToolboxOpen: boolean
  onToolboxOpenChange: (open: boolean) => void
  currentPipeline: TransformationPipeline
  initialPreviewText?: string
  vimMode?: boolean
}

/**
 * Mobile layout for the transformer dialog with tabbed navigation and toolbox overlay.
 * @param props - Component props
 * @returns Mobile view component
 */
export function TransformerMobileView({
  activeTab,
  onActiveTabChange,
  steps,
  onSetSteps,
  onUpdateStep,
  onRemoveStep,
  onToggleStep,
  onAddOperation,
  isToolboxOpen,
  onToolboxOpenChange,
  currentPipeline,
  initialPreviewText,
  vimMode,
}: TransformerMobileViewProps): ReactElement {
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <Tabs value={activeTab} onValueChange={onActiveTabChange} className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-background p-0 h-10">
          <TabsTrigger
            value="pipeline"
            className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Edit ({steps.length})
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="flex-1 m-0 overflow-hidden h-full overflow-y-auto">
          <TransformerWorkbench
            steps={steps}
            onSetSteps={onSetSteps}
            onUpdateStep={onUpdateStep}
            onRemoveStep={onRemoveStep}
            onToggleStep={onToggleStep}
            onAddOperation={onAddOperation}
            onAddRequest={() => onToolboxOpenChange(true)}
            vimMode={vimMode}
          />
        </TabsContent>
        <TabsContent value="preview" className="flex-1 m-0 overflow-hidden h-full overflow-y-auto">
          <TransformerPreview pipeline={currentPipeline} initialText={initialPreviewText} />
        </TabsContent>
      </Tabs>

      {/* Toolbox Overlay */}
      {isToolboxOpen && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between p-3 border-b bg-background">
            <h3 className="font-semibold text-lg">Add Operation</h3>
            <Button variant="ghost" size="icon" onClick={() => onToolboxOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TransformerToolbox onAddStep={onAddOperation} enableDrag={false} />
          </div>
        </div>
      )}
    </div>
  )
}
