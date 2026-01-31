import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { OPERATIONS, ICON_MAP } from './constants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/utils/classnames'
import type { FormatterOperation } from './types'

interface ToolboxProps {
  onAddStep: (operation: FormatterOperation) => void
}

export function Toolbox({ onAddStep }: ToolboxProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOperations = OPERATIONS.filter((op) =>
    op.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 grid gap-2">
          {filteredOperations.map((op) => {
             const Icon = ICON_MAP[op.icon] || Plus
             return (
              <Button
                key={op.id}
                variant="outline"
                className="justify-start h-auto py-3 px-4 w-full text-left font-normal bg-background hover:bg-accent border-muted-foreground/20 hover:border-primary/50 group transition-all"
                onClick={() => onAddStep(op)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(op))
                }}
              >
                <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary mr-3 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{op.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{op.description}</div>
                </div>
                <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
              </Button>
            )
          })}
          
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
