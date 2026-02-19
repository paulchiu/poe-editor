import { useState, useCallback } from 'react'
import {
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { PipelineStep, TransformerOperation, DragData } from '@/components/transformer/types'

interface UseTransformerDragDropParams {
  steps: PipelineStep[]
  setSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>
  onAddOperation: (operation: TransformerOperation) => void
}

interface UseTransformerDragDropReturn {
  sensors: ReturnType<typeof useSensors>
  activeDragItem: PipelineStep | TransformerOperation | null
  activeDragWidth: number | undefined
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
}

/**
 * Hook managing drag-and-drop state and handlers for the transformer dialog.
 * @param params - Steps state and callbacks
 * @returns DnD sensors, active drag state, and event handlers
 */
export function useTransformerDragDrop({
  steps,
  setSteps,
  onAddOperation,
}: UseTransformerDragDropParams): UseTransformerDragDropReturn {
  const [activeDragItem, setActiveDragItem] = useState<PipelineStep | TransformerOperation | null>(
    null
  )
  const [activeDragWidth, setActiveDragWidth] = useState<number | undefined>(undefined)

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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeData = active.data.current as DragData | undefined

      if (activeData?.sortable?.index !== undefined) {
        const step = steps.find((s) => s.id === active.id)
        if (step) setActiveDragItem(step)
      } else if (activeData?.operation) {
        setActiveDragItem(activeData.operation)
      }

      // Capture width of the dragged element to prevent squashing in overlay
      if (active.id) {
        const element = document.getElementById(active.id as string)
        if (element) {
          setActiveDragWidth(element.offsetWidth)
        }
      }
    },
    [steps]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
        onAddOperation(operation)
      }
    },
    [setSteps, onAddOperation]
  )

  return {
    sensors,
    activeDragItem,
    activeDragWidth,
    handleDragStart,
    handleDragEnd,
  }
}
