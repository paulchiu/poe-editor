import { useState, type ReactElement } from 'react'
import { Search, Plus } from 'lucide-react'
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
}

export function DraggableToolboxItem({
  operation,
  onAddStep,
}: DraggableToolboxItemProps): ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${operation.id}`,
    data: {
      operation,
    },
  })

  const Icon = ICON_MAP[operation.icon] || Plus

  return (
    <Button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      variant="outline"
      className={cn(
        'justify-start h-auto py-3 px-4 w-full text-left font-normal bg-background hover:bg-accent border-muted-foreground/20 hover:border-primary/50 group transition-all',
        isDragging ? 'opacity-50' : ''
      )}
      onClick={() => onAddStep(operation)}
    >
      <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary mr-3 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{operation.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{operation.description}</div>
      </div>
      <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
    </Button>
  )
}

interface TransformerToolboxProps {
  onAddStep: (operation: TransformerOperation) => void
}

/**
 * Toolbox component displaying available transformer operations for pipeline building.
 * @param props - Component props
 * @returns Transformer toolbox component
 */
export function TransformerToolbox({ onAddStep }: TransformerToolboxProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<OperationCategory | 'All'>('All')

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
            onChange={(e) => setSearchQuery(e.target.value)}
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

      <ScrollArea className="flex-1">
        <div className="p-4 grid gap-2">
          {filteredOperations.map((op) => (
            <DraggableToolboxItem key={op.id} operation={op} onAddStep={onAddStep} />
          ))}

          {filteredOperations.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No operations found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
