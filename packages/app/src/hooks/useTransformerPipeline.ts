import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useToast } from '@/hooks/useToast'
import {
  generateId,
  validatePipelineName,
  validatePipelineSteps,
  buildPipeline,
} from '@/components/transformer/pipelineUtils'
import type {
  PipelineStep,
  TransformationPipeline,
  TransformerOperation,
} from '@/components/transformer/types'

interface UseTransformerPipelineParams {
  open: boolean
  editPipeline?: TransformationPipeline | null
  onSave: (pipeline: TransformationPipeline) => void
  onApply?: (pipeline: TransformationPipeline) => void
  onOpenChange: (open: boolean) => void
}

interface UseTransformerPipelineReturn {
  pipelineName: string
  setPipelineName: (name: string) => void
  pipelineIcon: string
  setPipelineIcon: (icon: string) => void
  steps: PipelineStep[]
  setSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>
  activeTab: string
  setActiveTab: (tab: string) => void
  isToolboxOpen: boolean
  setIsToolboxOpen: (open: boolean) => void
  currentPipeline: TransformationPipeline
  handleAddOperation: (operation: TransformerOperation) => void
  handleUpdateStep: (id: string, config: Record<string, unknown>) => void
  handleRemoveStep: (id: string) => void
  handleToggleStep: (id: string) => void
  handleSave: () => void
  handleApply: () => void
  handleSaveAndApply: () => void
}

/**
 * Hook managing pipeline state and CRUD operations for the transformer dialog.
 * @param params - Pipeline configuration and callbacks
 * @returns Pipeline state and handler functions
 */
export function useTransformerPipeline({
  open,
  editPipeline,
  onSave,
  onApply,
  onOpenChange,
}: UseTransformerPipelineParams): UseTransformerPipelineReturn {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('pipeline')
  const [pipelineName, setPipelineName] = useState('')
  const [pipelineIcon, setPipelineIcon] = useState('🪄')
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)

  // Track previous open state to detect dialog open transition
  const wasOpenRef = useRef(open)

  // Load edit state only when dialog transitions from closed to open
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open

    // Only run when dialog opens (was closed, now open)
    if (open && !wasOpen) {
      // Defer state updates to avoid synchronous setState in effect
      queueMicrotask(() => {
        setPipelineName(editPipeline?.name ?? '')
        setPipelineIcon(editPipeline?.icon ?? '🪄')
        setSteps(editPipeline?.steps ?? [])
        setActiveTab('pipeline')
        setIsToolboxOpen(false)
      })
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

  const resetState = useCallback(() => {
    setSteps([])
    setPipelineName('')
    setPipelineIcon('🪄')
  }, [])

  const handleSave = useCallback(() => {
    const nameError = validatePipelineName(pipelineName)
    if (nameError) {
      toast({ description: nameError })
      return
    }

    const stepsError = validatePipelineSteps(steps, 'saving')
    if (stepsError) {
      toast({ description: stepsError })
      return
    }

    const pipeline = buildPipeline({
      id: editPipeline?.id,
      name: pipelineName,
      icon: pipelineIcon,
      steps,
    })

    onSave(pipeline)
    onOpenChange(false)
    resetState()
  }, [pipelineName, pipelineIcon, steps, editPipeline?.id, onSave, onOpenChange, toast, resetState])

  // Construct temporary pipeline for preview
  const currentPipeline = useMemo<TransformationPipeline>(
    () => ({
      id: 'preview',
      name: 'Preview',
      icon: 'preview',
      steps,
    }),
    [steps]
  )

  const handleApply = useCallback(() => {
    const stepsError = validatePipelineSteps(steps, 'applying')
    if (stepsError) {
      toast({ description: stepsError })
      return
    }

    if (onApply) {
      onApply(currentPipeline)
      onOpenChange(false)
    }
  }, [steps, onApply, onOpenChange, toast, currentPipeline])

  const handleSaveAndApply = useCallback(() => {
    const nameError = validatePipelineName(pipelineName)
    if (nameError) {
      toast({ description: nameError })
      return
    }

    const stepsError = validatePipelineSteps(steps, 'saving and applying')
    if (stepsError) {
      toast({ description: stepsError })
      return
    }

    const pipeline = buildPipeline({
      id: editPipeline?.id,
      name: pipelineName,
      icon: pipelineIcon,
      steps,
    })

    onSave(pipeline)
    if (onApply) {
      onApply(pipeline)
    }
    onOpenChange(false)
    resetState()
  }, [
    pipelineName,
    pipelineIcon,
    steps,
    editPipeline?.id,
    onSave,
    onApply,
    onOpenChange,
    toast,
    resetState,
  ])

  return {
    pipelineName,
    setPipelineName,
    pipelineIcon,
    setPipelineIcon,
    steps,
    setSteps,
    activeTab,
    setActiveTab,
    isToolboxOpen,
    setIsToolboxOpen,
    currentPipeline,
    handleAddOperation,
    handleUpdateStep,
    handleRemoveStep,
    handleToggleStep,
    handleSave,
    handleApply,
    handleSaveAndApply,
  }
}
