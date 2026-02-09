import { useState, type ReactElement, type ChangeEvent } from 'react'
import { useToast } from '@/hooks/useToast'
import { Search, Plus, GripVertical } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { OPERATIONS, ICON_MAP } from './constants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/utils/classnames'
import type { TransformerOperation, OperationCategory } from './types'

interface DraggableToolboxItemProps {
  operation: TransformerOperation
  onAddStep: (operation: TransformerOperation) => void
  isOverlay?: boolean
  style?: React.CSSProperties
  enableDrag?: boolean
}

/**
 * Draggable item component for the transformer toolbox.
 * @param props - Component props
 * @returns The draggable item component
 */
export function DraggableToolboxItem({
  operation,
  onAddStep,
  isOverlay,
  style: styleProp,
  enableDrag = true,
}: DraggableToolboxItemProps): ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${operation.id}`,
    disabled: isOverlay || !enableDrag,
    data: {
      operation,
    },
  })

  const Icon = ICON_MAP[operation.icon] || Plus

  if (isOverlay) {
    return (
      <Button
        ref={setNodeRef}
        variant="outline"
        style={{ ...styleProp }}
        className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/20 shadow-xl w-full max-w-full min-w-0 h-auto"
      >
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="font-medium text-sm text-primary">{operation.name}</span>
      </Button>
    )
  }

  return (
    <div
      id={!isOverlay ? `toolbox-${operation.id}` : undefined}
      ref={setNodeRef}
      style={styleProp}
      className={cn(
        'flex items-center w-full rounded-md border bg-background hover:bg-accent border-muted-foreground/20 hover:border-primary/50 group transition-all overflow-hidden',
        isDragging ? 'opacity-50' : ''
      )}
    >
      {enableDrag && (
        <div
          {...listeners}
          {...attributes}
          className="p-3 pr-1 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors self-stretch flex items-center"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <button
        type="button"
        className={cn(
          'flex-1 flex items-center py-3 px-4 pl-2 text-left bg-transparent border-none cursor-pointer outline-none w-full min-w-0',
          !enableDrag && 'pl-4'
        )}
        onClick={() => onAddStep(operation)}
      >
        <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary mr-3 transition-colors shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{operation.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{operation.description}</div>
        </div>
        <Plus className="w-4 h-4 ml-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0" />
      </button>
    </div>
  )
}

interface TransformerToolboxProps {
  onAddStep: (operation: TransformerOperation) => void
  enableDrag?: boolean
}

/**
 * Toolbox component displaying available transformer operations for pipeline building.
 * @param props - Component props
 * @returns Transformer toolbox component
 */
export function TransformerToolbox({
  onAddStep,
  enableDrag = true,
}: TransformerToolboxProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<OperationCategory | 'All'>('All')
  const { toast } = useToast()

  const categories: (OperationCategory | 'All')[] = [
    'All',
    'Text',
    'Lines',
    'Structure',
    'Search',
    'Data',
  ]

  const filteredOperations = OPERATIONS.filter((op) => {
    const matchesSearch = op.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || op.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '/add-all') {
      OPERATIONS.forEach((op) => onAddStep(op))
      toast({
        description: 'All available operations have been added to the workbench.',
      })
      setSearchQuery('')
      return
    }
    setSearchQuery(value)
  }

  const listContent = (
    <div className="p-4 grid gap-2">
      {filteredOperations.map((op) => (
        <DraggableToolboxItem
          key={op.id}
          operation={op}
          onAddStep={onAddStep}
          enableDrag={enableDrag}
        />
      ))}

      {filteredOperations.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">No operations found.</div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="p-4 border-b space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Operations
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 bg-background"
          />
        </div>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {cat.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {enableDrag ? (
        <ScrollArea className="flex-1">{listContent}</ScrollArea>
      ) : (
        <div className="flex-1 overflow-y-auto">{listContent}</div>
      )}
    </div>
  )
}
