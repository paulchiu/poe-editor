import { useState, useCallback, useEffect, useRef, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useToast } from '@/hooks/useToast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wand2, Save, ChevronDown, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconPicker } from './IconPicker'
import { TransformerToolbox, DraggableToolboxItem } from './TransformerToolbox'
import { TransformerWorkbench } from './TransformerWorkbench'
import { TransformerPreview } from './TransformerPreview'
import { TransformerStep } from './TransformerStep'
import type { TransformationPipeline, PipelineStep, TransformerOperation } from './types'

interface TransformerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pipeline: TransformationPipeline) => void
  onApply?: (pipeline: TransformationPipeline) => void
  editPipeline?: TransformationPipeline | null
  initialPreviewText?: string
}

const generateId = (): string => Math.random().toString(36).substring(2, 9)

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
}: TransformerDialogProps): ReactElement {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('pipeline')
  const [pipelineName, setPipelineName] = useState('')
  const [pipelineIcon, setPipelineIcon] = useState('🪄')
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [activeDragItem, setActiveDragItem] = useState<PipelineStep | TransformerOperation | null>(
    null
  )
  const [activeDragWidth, setActiveDragWidth] = useState<number | undefined>(undefined)

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Track previous open state to detect dialog open transition
  const wasOpenRef = useRef(open)

  // Configure sensors for drag and drop
  // Using PointerSensor exclusively provides the best compatibility for both mouse and touch
  // when touch-action: none is applied to draggable elements.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Load edit state only when dialog transitions from closed to open
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open

    // Only run when dialog opens (was closed, now open)
    if (open && !wasOpen) {
      if (editPipeline) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPipelineName(editPipeline.name)

        setPipelineIcon(editPipeline.icon)

        setSteps(editPipeline.steps)
      } else {
        // Reset to default for new pipeline

        setPipelineName('')

        setPipelineIcon('🪄')

        setSteps([])
      }

      setActiveTab('pipeline')
      setIsToolboxOpen(false)
    }
  }, [open, editPipeline])

  const handleAddOperation = useCallback((operation: TransformerOperation) => {
    const newStep: PipelineStep = {
      id: generateId(),
      operationId: operation.id,
      config: { ...operation.defaultConfig },
      enabled: true,
    }
    setSteps((prev) => [...prev, newStep])
    setIsToolboxOpen(false)
  }, [])

  const handleUpdateStep = useCallback((id: string, config: Record<string, unknown>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, config } : s)))
  }, [])

  const handleRemoveStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleToggleStep = useCallback((id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }, [])

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeData = active.data.current as any

    if (activeData?.sortable?.index !== undefined) {
      // It's a step being reordered
      // Find the step object
      const step = steps.find((s) => s.id === active.id)
      if (step) setActiveDragItem(step)
    } else if (activeData?.operation) {
      // It's a new operation from toolbox
      setActiveDragItem(activeData.operation)
    }

    // Capture width of the dragged element to prevent squashing in overlay
    if (active.id) {
      const element = document.getElementById(active.id as string)
      if (element) {
        setActiveDragWidth(element.offsetWidth)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragItem(null)
    setActiveDragWidth(undefined)

    if (!over) return

    // Case 1: Reordering steps
    if (
      active.data.current?.sortable?.index !== undefined &&
      over.data.current?.sortable?.index !== undefined &&
      active.id !== over.id
    ) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      return
    }

    // Case 2: Dropping new operation from toolbox
    if (active.data.current?.operation && over.id === 'workbench-container') {
      const operation = active.data.current.operation as TransformerOperation
      handleAddOperation(operation)
    }
  }

  const handleSave = () => {
    if (!pipelineName.trim()) {
      toast({
        description: 'Please enter a name for your pipeline.',
      })
      return
    }

    if (steps.length === 0) {
      toast({
        description: 'Add at least one step to the pipeline before saving.',
      })
      return
    }

    const newPipeline: TransformationPipeline = {
      id: editPipeline?.id || generateId(),
      name: pipelineName,
      icon: pipelineIcon || '🪄',
      steps,
    }

    onSave(newPipeline)
    onOpenChange(false)

    // Reset state
    setSteps([])
    setPipelineName('')
    setPipelineIcon('🪄')
  }

  const handleApply = () => {
    if (steps.length === 0) {
      toast({
        description: 'Add at least one step to the pipeline before applying.',
      })
      return
    }

    if (onApply) {
      onApply(currentPipeline)
      onOpenChange(false)
    }
  }

  const handleSaveAndApply = () => {
    if (!pipelineName.trim()) {
      toast({
        description: 'Please enter a name for your pipeline.',
      })
      return
    }

    if (steps.length === 0) {
      toast({
        description: 'Add at least one step to the pipeline before saving and applying.',
      })
      return
    }

    const newPipeline: TransformationPipeline = {
      id: editPipeline?.id || generateId(),
      name: pipelineName,
      icon: pipelineIcon || '🪄',
      steps,
    }

    onSave(newPipeline)
    if (onApply) {
      onApply(newPipeline)
    }
    onOpenChange(false)

    // Reset state
    setSteps([])
    setPipelineName('')
    setPipelineIcon('🪄')
  }

  // Construct temporary pipeline for preview
  const currentPipeline: TransformationPipeline = {
    id: 'preview',
    name: 'Preview',
    icon: 'presview',
    steps,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-[90vw] w-full h-[100dvh] sm:w-[90vw] sm:h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background focus:outline-none max-w-none rounded-none sm:rounded-lg"
        >
          <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-y-3 sm:gap-y-0 space-y-0 pr-12">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <DialogTitle>{editPipeline ? 'Edit Transformer' : 'Transform Selection'}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Create and edit custom text transformation pipelines
            </DialogDescription>

            <div className="flex items-center gap-2 ml-auto sm:ml-0 order-2 sm:order-3">
              {initialPreviewText ? (
                <div className="flex items-center -space-x-px">
                  <Button
                    variant="ghost"
                    onClick={handleApply}
                    className="h-10 rounded-r-none border-r"
                  >
                    Apply
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 px-2 rounded-l-none">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSaveAndApply}>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Apply
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="ghost" onClick={handleSave} className="h-10">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto order-3 sm:order-2 sm:mr-4">
              <IconPicker value={pipelineIcon} onChange={setPipelineIcon} />
              <Input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="flex-1 sm:w-40 md:w-64 h-10"
                placeholder="Pipeline Name (e.g. Clean & Sort)"
              />
            </div>
          </DialogHeader>

          {/* Mobile View */}
          {!isDesktop && (
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
                <TabsContent
                  value="pipeline"
                  className="flex-1 m-0 overflow-hidden h-full overflow-y-auto"
                >
                  <TransformerWorkbench
                    steps={steps}
                    onUpdateStep={handleUpdateStep}
                    onRemoveStep={handleRemoveStep}
                    onToggleStep={handleToggleStep}
                    onAddOperation={handleAddOperation}
                    onAddRequest={() => setIsToolboxOpen(true)}
                  />
                </TabsContent>
                <TabsContent
                  value="preview"
                  className="flex-1 m-0 overflow-hidden h-full overflow-y-auto"
                >
                  <TransformerPreview pipeline={currentPipeline} initialText={initialPreviewText} />
                </TabsContent>
              </Tabs>

              {/* Toolbox Overlay */}
              {isToolboxOpen && (
                <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between p-3 border-b bg-background">
                    <h3 className="font-semibold text-lg">Add Operation</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsToolboxOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <TransformerToolbox onAddStep={handleAddOperation} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop View */}
          {isDesktop && (
            <div className="flex-1 overflow-hidden h-full">
              <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="h-full overflow-y-auto bg-muted/5">
                    <TransformerToolbox onAddStep={handleAddOperation} />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="h-full overflow-y-auto bg-background/50">
                    <TransformerWorkbench
                      steps={steps}
                      onUpdateStep={handleUpdateStep}
                      onRemoveStep={handleRemoveStep}
                      onToggleStep={handleToggleStep}
                      onAddOperation={handleAddOperation}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="h-full overflow-y-auto">
                    <TransformerPreview
                      pipeline={currentPipeline}
                      initialText={initialPreviewText}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {createPortal(
        <DragOverlay className="z-[100] pointer-events-none" modifiers={[]} dropAnimation={null}>
          {activeDragItem ? (
            'operationId' in activeDragItem ? (
              // It's a Step
              <div className="opacity-80">
                <TransformerStep
                  step={activeDragItem as PipelineStep}
                  index={-1}
                  onUpdate={() => {}}
                  onRemove={() => {}}
                  onToggle={() => {}}
                  isOverlay
                  style={{ width: activeDragWidth, margin: 0 }}
                />
              </div>
            ) : (
              // It's a new Operation
              <div className="opacity-80">
                <DraggableToolboxItem
                  operation={activeDragItem as TransformerOperation}
                  onAddStep={() => {}}
                  isOverlay
                  style={{ width: activeDragWidth, margin: 0 }}
                />
              </div>
            )
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}
