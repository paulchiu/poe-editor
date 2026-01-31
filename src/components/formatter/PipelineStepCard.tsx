import { useState } from 'react'
import {
  GripVertical,
  X,
  Settings2,
  Trash2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { OPERATIONS, ICON_MAP } from './constants'
import { cn } from '@/utils/classnames'
import type { PipelineStep } from './types'

interface PipelineStepCardProps {
  step: PipelineStep
  index: number
  onUpdate: (id: string, config: Record<string, any>) => void
  onRemove: (id: string) => void
  onToggle: (id: string) => void
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
}

export function PipelineStepCard({
  step,
  index,
  onUpdate,
  onRemove,
  onToggle,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: PipelineStepCardProps) {
  const [showConfig, setShowConfig] = useState(true) // Default open configuration
  
  const operation = OPERATIONS.find((op) => op.id === step.operationId)
  if (!operation) return null

  const Icon = ICON_MAP[operation.icon]

  /* 
     Determine if this operation has any configurable options.
     We check if the renderConfig returns null, but we need to know *before* rendering.
     Simpler check: these operations have no config in this app.
  */
  const hasConfig = !['trim', 'unique'].includes(step.operationId)

  // ... (renderConfig function remains same, but we use hasConfig for toggle visibility)

  const renderConfig = () => {
    switch (step.operationId) {
      case 'replace':
        return (
          <div className="grid grid-cols-2 gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Find</label>
              <Input
                value={step.config.from as string || ''}
                onChange={(e) => onUpdate(step.id, { ...step.config, from: e.target.value })}
                placeholder="Text to find..."
                className="h-8 text-xs bg-muted/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Replace With</label>
              <Input
                value={step.config.to as string || ''}
                onChange={(e) => onUpdate(step.id, { ...step.config, to: e.target.value })}
                placeholder="Replacement..."
                className="h-8 text-xs bg-muted/20"
              />
            </div>
          </div>
        )
      
      case 'change-case':
        return (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
             <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Case Mode</label>
              <div className="flex bg-muted/20 p-1 rounded-md border text-xs">
                {['upper', 'lower', 'title'].map((mode) => (
                  <button
                    key={mode}
                    className={cn(
                      "flex-1 py-1 rounded-sm capitalize transition-colors",
                      step.config.mode === mode ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onUpdate(step.id, { ...step.config, mode })}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'sort-lines':
         return (
          <div className="flex gap-3 mt-3 animate-in slide-in-from-top-2 duration-200 text-left items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Direction</label>
              <div className="flex bg-muted/20 p-1 rounded-md border text-xs h-[34px] items-center">
                {['asc', 'desc'].map((dir) => (
                   <button
                    key={dir}
                    className={cn(
                      "flex-1 py-1 rounded-sm capitalize transition-colors h-full flex items-center justify-center",
                      step.config.direction === dir ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onUpdate(step.id, { ...step.config, direction: dir })}
                  >
                    {dir === 'asc' ? 'A-Z' : 'Z-A'}
                  </button>
                ))}
              </div>
            </div>
             <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">&nbsp;</label>
               <label className="flex items-center gap-2 h-[34px] px-3 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!step.config.numeric}
                    onChange={(e) => onUpdate(step.id, { ...step.config, numeric: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary h-3 w-3"
                  />
                  Numeric Sort
               </label>
            </div>
          </div>
         )
      
      case 'join-lines':
      case 'split-lines':
        return (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Separator</label>
              <Input
                value={step.config.separator as string || ''}
                onChange={(e) => onUpdate(step.id, { ...step.config, separator: e.target.value })}
                placeholder={step.operationId === 'join-lines' ? 'Space, comma, etc.' : 'Separator character'}
                className="h-8 text-xs bg-muted/20 font-mono"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div 
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-xl border bg-card transition-all duration-200 w-full max-w-full min-w-0",
        step.enabled ? "shadow-sm border-muted-foreground/10 hover:border-primary/30" : "opacity-60 border-transparent bg-muted/5",
      )}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Drag Handle - Aligned with icon */}
      <div className="mt-2 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors self-start pt-0.5">
        <GripVertical className="h-4 w-4" />
      </div>

       {/* Icon */}
       <div className={cn(
        "p-2 rounded-lg transition-colors mt-0",
        step.enabled ? "bg-primary/5 text-primary" : "bg-muted text-muted-foreground"
       )}>
          {Icon && <Icon className="h-4 w-4" />}
       </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between h-8">
          <span className={cn(
            "font-medium text-sm transition-colors",
             step.enabled ? "text-foreground" : "text-muted-foreground"
          )}>
            {operation.name}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasConfig && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("h-7 w-7", showConfig && "bg-muted text-foreground")}
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(step.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Switch
              checked={step.enabled}
              onCheckedChange={() => onToggle(step.id)}
              className="ml-1 scale-75 origin-right"
            />
          </div>
        </div>

        {hasConfig && showConfig && renderConfig()}
      </div>
    </div>
  )
}
