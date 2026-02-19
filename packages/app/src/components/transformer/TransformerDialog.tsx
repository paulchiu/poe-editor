import { useRef, useEffect, type ReactElement } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { Save, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTransformerPipeline } from '@/hooks/useTransformerPipeline'
import { useTransformerDragDrop } from '@/hooks/useTransformerDragDrop'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TransformerDialogHeader } from './TransformerDialogHeader'
import { TransformerMobileView } from './TransformerMobileView'
import { TransformerDesktopView } from './TransformerDesktopView'
import { TransformerDragOverlay } from './TransformerDragOverlay'
import type { TransformationPipeline } from './types'

interface TransformerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pipeline: TransformationPipeline) => void
  onApply?: (pipeline: TransformationPipeline) => void
  editPipeline?: TransformationPipeline | null
  initialPreviewText?: string
  vimMode?: boolean
}

/**
 * Dialog for creating and editing custom text transformation pipelines.
 * @param props - Component props
 * @returns Transformer dialog component
 */
export function TransformerDialog({
  open,
  onOpenChange,
  onSave,
  onApply,
  editPipeline,
  initialPreviewText,
  vimMode,
}: TransformerDialogProps): ReactElement {
  const { toast } = useToast()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Track if escape toast has been shown in this session
  const hasShownEscapeToastRef = useRef(false)

  const pipeline = useTransformerPipeline({
    open,
    editPipeline,
    onSave,
    onApply,
    onOpenChange,
  })

  const dnd = useTransformerDragDrop({
    steps: pipeline.steps,
    setSteps: pipeline.setSteps,
    onAddOperation: pipeline.handleAddOperation,
  })

  // Reset escape toast tracking when dialog opens
  const wasOpenRef = useRef(open)
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open
    if (open && !wasOpen) {
      hasShownEscapeToastRef.current = false
    }
  }, [open])

  // Configure split button actions
  const splitButtonActions = [
    { id: 'save', label: 'Save', icon: Save, handler: pipeline.handleSave },
    { id: 'apply', label: 'Apply', icon: Wand2, handler: pipeline.handleApply },
    { id: 'saveAndApply', label: 'Save & Apply', icon: Save, handler: pipeline.handleSaveAndApply },
  ]
  const primaryActionId = editPipeline ? 'saveAndApply' : 'apply'

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={closestCenter}
      onDragStart={dnd.handleDragStart}
      onDragEnd={dnd.handleDragEnd}
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-[90vw] w-full h-[100dvh] sm:w-[90vw] sm:h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background focus:outline-none max-w-none rounded-none sm:rounded-lg"
          onEscapeKeyDown={(e) => {
            const target = e.target as HTMLElement
            const isMonaco = target?.closest?.('.monaco-editor')

            if (isMonaco) {
              e.preventDefault()

              if (!hasShownEscapeToastRef.current) {
                hasShownEscapeToastRef.current = true
                toast({
                  description: 'Escape disabled in editor, exit editor mode to close',
                })
              }
            }
          }}
        >
          <TransformerDialogHeader
            editPipeline={editPipeline}
            initialPreviewText={initialPreviewText}
            pipelineName={pipeline.pipelineName}
            onPipelineNameChange={pipeline.setPipelineName}
            pipelineIcon={pipeline.pipelineIcon}
            onPipelineIconChange={pipeline.setPipelineIcon}
            onSave={pipeline.handleSave}
            splitButtonActions={splitButtonActions}
            primaryActionId={primaryActionId}
          />

          {!isDesktop && (
            <TransformerMobileView
              activeTab={pipeline.activeTab}
              onActiveTabChange={pipeline.setActiveTab}
              steps={pipeline.steps}
              onSetSteps={pipeline.setSteps}
              onUpdateStep={pipeline.handleUpdateStep}
              onRemoveStep={pipeline.handleRemoveStep}
              onToggleStep={pipeline.handleToggleStep}
              onAddOperation={pipeline.handleAddOperation}
              isToolboxOpen={pipeline.isToolboxOpen}
              onToolboxOpenChange={pipeline.setIsToolboxOpen}
              currentPipeline={pipeline.currentPipeline}
              initialPreviewText={initialPreviewText}
              vimMode={vimMode}
            />
          )}

          {isDesktop && (
            <TransformerDesktopView
              steps={pipeline.steps}
              onSetSteps={pipeline.setSteps}
              onUpdateStep={pipeline.handleUpdateStep}
              onRemoveStep={pipeline.handleRemoveStep}
              onToggleStep={pipeline.handleToggleStep}
              onAddOperation={pipeline.handleAddOperation}
              currentPipeline={pipeline.currentPipeline}
              initialPreviewText={initialPreviewText}
              vimMode={vimMode}
            />
          )}
        </DialogContent>
      </Dialog>
      <TransformerDragOverlay
        activeDragItem={dnd.activeDragItem}
        activeDragWidth={dnd.activeDragWidth}
      />
    </DndContext>
  )
}
