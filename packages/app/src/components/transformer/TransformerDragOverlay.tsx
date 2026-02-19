import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { TransformerStep } from './TransformerStep'
import { DraggableToolboxItem } from './TransformerToolbox'
import type { PipelineStep, TransformerOperation } from './types'

interface TransformerDragOverlayProps {
  activeDragItem: PipelineStep | TransformerOperation | null
  activeDragWidth?: number
}

/**
 * Drag overlay portal for the transformer dialog, rendering dragged steps or operations.
 * @param props - Component props
 * @returns Drag overlay rendered via portal
 */
export function TransformerDragOverlay({
  activeDragItem,
  activeDragWidth,
}: TransformerDragOverlayProps): ReactElement {
  return createPortal(
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
  ) as ReactElement
}
