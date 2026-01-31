import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wand2, Save } from 'lucide-react'
import { IconPicker } from './IconPicker'
import { Toolbox } from './Toolbox'
import { PipelineWorkbench } from './PipelineWorkbench'
import { LivePreview } from './LivePreview'
import type { TransformationPipeline, PipelineStep, FormatterOperation } from './types'

interface FormatterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pipeline: TransformationPipeline) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export function FormatterDialog({ open, onOpenChange, onSave }: FormatterDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('pipeline')
  const [pipelineName, setPipelineName] = useState('')
  const [pipelineIcon, setPipelineIcon] = useState('🪄')
  
  // Pipeline state
  const [steps, setSteps] = useState<PipelineStep[]>([])

  const handleAddOperation = useCallback((operation: FormatterOperation) => {
    const newStep: PipelineStep = {
      id: generateId(),
      operationId: operation.id,
      config: { ...operation.defaultConfig },
      enabled: true,
    }
    setSteps((prev) => [...prev, newStep])
    // Switch to pipeline tab on mobile if added
    if (window.innerWidth < 1024) {
      setActiveTab('pipeline')
    }
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

  const handleMoveStep = useCallback((dragIndex: number, hoverIndex: number) => {
    setSteps((prev) => {
      const newSteps = [...prev]
      const [removed] = newSteps.splice(dragIndex, 1)
      newSteps.splice(hoverIndex, 0, removed)
      return newSteps
    })
  }, [])

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
      id: generateId(),
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

  // Construct temporary pipeline for preview
  const currentPipeline: TransformationPipeline = {
    id: 'preview',
    name: 'Preview',
    icon: 'presview',
    steps,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[90vw] w-[90vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background focus:outline-none"
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center justify-between space-y-0 pr-12">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <DialogTitle>Formatter Builder</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Create and edit custom text transformation pipelines
          </DialogDescription>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <IconPicker
                value={pipelineIcon}
                onChange={setPipelineIcon}
              />
              <Input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="w-40 md:w-64 h-10"
                placeholder="Pipeline Name (e.g. Clean & Sort)"
              />
            </div>
            <Button variant="ghost" onClick={handleSave} className="h-10">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogHeader>
        
        {/* Mobile View */}
        <div className="flex-1 lg:hidden overflow-hidden flex flex-col">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-background p-0 h-10">
               <TabsTrigger value="toolbox" className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">Toolbox</TabsTrigger>
               <TabsTrigger value="pipeline" className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">Pipeline ({steps.length})</TabsTrigger>
               <TabsTrigger value="preview" className="flex-1 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">Preview</TabsTrigger>
             </TabsList>
             <TabsContent value="toolbox" className="flex-1 m-0 overflow-hidden h-full overflow-y-auto">
                <Toolbox onAddStep={handleAddOperation} />
             </TabsContent>
             <TabsContent value="pipeline" className="flex-1 m-0 overflow-hidden h-full overflow-y-auto">
                <PipelineWorkbench
                  steps={steps}
                  onUpdateStep={handleUpdateStep}
                  onRemoveStep={handleRemoveStep}
                  onToggleStep={handleToggleStep}
                  onMoveStep={handleMoveStep}
                  onAddOperation={handleAddOperation}
                />
             </TabsContent>
              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden h-full overflow-y-auto">
                <LivePreview pipeline={currentPipeline} />
             </TabsContent>
           </Tabs>
        </div>

        {/* Desktop View */}
        <div className="flex-1 hidden lg:block overflow-hidden h-full">
          <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full overflow-y-auto bg-muted/5">
                <Toolbox onAddStep={handleAddOperation} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full overflow-y-auto bg-background/50">
                <PipelineWorkbench
                  steps={steps}
                  onUpdateStep={handleUpdateStep}
                  onRemoveStep={handleRemoveStep}
                  onToggleStep={handleToggleStep}
                  onMoveStep={handleMoveStep}
                  onAddOperation={handleAddOperation}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={20}>
               <div className="h-full overflow-y-auto">
                <LivePreview pipeline={currentPipeline} />
               </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  )
}
