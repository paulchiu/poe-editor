import { useState } from 'react'
import type { ReactElement } from 'react'
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
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { ICON_MAP } from '@/components/transformer/constants'
import type { TransformationPipeline } from '@/components/transformer/types'
import { cn } from '@/utils/classnames'
import { ToolbarButton } from '@/components/editor-toolbar/ToolbarButton'

interface SortablePipelineButtonProps {
  pipeline: TransformationPipeline
  isActive: boolean
  onApply?: (pipeline: TransformationPipeline) => void
  onEdit?: (pipeline: TransformationPipeline) => void
  onDeleteRequest?: (pipeline: TransformationPipeline) => void
}

interface PipelinesToolbarGroupProps {
  pipelines: TransformationPipeline[]
  onApplyPipeline?: (pipeline: TransformationPipeline) => void
  onEditPipeline?: (pipeline: TransformationPipeline) => void
  onDeletePipeline?: (id: string) => void
  onReorderPipelines?: (pipelines: TransformationPipeline[]) => void
}

function renderPipelineIcon(pipeline: TransformationPipeline): ReactElement {
  const PipelineIcon = ICON_MAP[pipeline.icon]

  if (PipelineIcon) {
    return <PipelineIcon className="size-4" />
  }

  return (
    <span className="text-sm px-0.5" role="img" aria-label={pipeline.name}>
      {pipeline.icon}
    </span>
  )
}

/**
 * Sortable wrapper for a transformation pipeline button.
 * @param props - Component props.
 * @returns Sortable pipeline button element.
 */
function SortablePipelineButton({
  pipeline,
  isActive,
  onApply,
  onEdit,
  onDeleteRequest,
}: SortablePipelineButtonProps): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pipeline.id,
    data: { pipeline },
  })
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={cn(
        'transition-opacity flex items-center',
        isActive && 'cursor-grabbing',
        !isActive && 'cursor-grab'
      )}
    >
      <ContextMenu onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <div>
            <ToolbarButton
              icon={() => renderPipelineIcon(pipeline)}
              label={pipeline.name}
              onClick={() => onApply?.(pipeline)}
              allowDrag
              className={!ICON_MAP[pipeline.icon] ? 'w-auto px-2 min-w-8' : undefined}
              dragAttributes={attributes}
              dragListeners={listeners}
              tooltipDisabled={isContextMenuOpen}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEdit?.(pipeline)}>
            <Pencil className="size-4" />
            Edit Transformer
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={() => onDeleteRequest?.(pipeline)}>
            <Trash2 className="size-4" />
            Delete Transformer
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

/**
 * Renders draggable pipeline buttons with context-menu actions.
 * @param props - Component props.
 * @returns Pipeline toolbar group element.
 */
export function PipelinesToolbarGroup({
  pipelines,
  onApplyPipeline,
  onEditPipeline,
  onDeletePipeline,
  onReorderPipelines,
}: PipelinesToolbarGroupProps): ReactElement {
  const [pipelineToDelete, setPipelineToDelete] = useState<TransformationPipeline | null>(null)
  const [activeDragPipeline, setActiveDragPipeline] = useState<TransformationPipeline | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent): void => {
    if (event.active.data.current?.pipeline) {
      setActiveDragPipeline(event.active.data.current.pipeline)
    }
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveDragPipeline(null)
    const { active, over } = event

    if (!over) {
      return
    }

    if (active.id !== over.id) {
      const oldIndex = pipelines.findIndex((pipeline) => pipeline.id === active.id)
      const newIndex = pipelines.findIndex((pipeline) => pipeline.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPipelines?.(arrayMove(pipelines, oldIndex, newIndex))
      }
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-px h-5 bg-border mx-1" />
        <div className="flex items-center gap-1">
          <SortableContext items={pipelines} strategy={horizontalListSortingStrategy}>
            {pipelines.map((pipeline) => (
              <SortablePipelineButton
                key={pipeline.id}
                pipeline={pipeline}
                isActive={activeDragPipeline?.id === pipeline.id}
                onApply={onApplyPipeline}
                onEdit={onEditPipeline}
                onDeleteRequest={setPipelineToDelete}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeDragPipeline ? (
            <div className="opacity-80">
              <ToolbarButton
                icon={() => renderPipelineIcon(activeDragPipeline)}
                label={activeDragPipeline.name}
                className={!ICON_MAP[activeDragPipeline.icon] ? 'w-auto px-2 min-w-8' : undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog
        open={!!pipelineToDelete}
        onOpenChange={(open) => !open && setPipelineToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transformer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{pipelineToDelete?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pipelineToDelete) {
                  onDeletePipeline?.(pipelineToDelete.id)
                  setPipelineToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
