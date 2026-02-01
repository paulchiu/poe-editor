import { useState, type ReactElement } from 'react'
import { GripVertical, Settings2, Trash2, WrapText, TextSelect } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { OPERATIONS, ICON_MAP } from './constants'
import { cn } from '@/utils/classnames'
import type { PipelineStep } from './types'
import { ReplaceConfig } from './step-configs/ReplaceConfig'
import { TrimConfig } from './step-configs/TrimConfig'
import { EmptyLinesConfig } from './step-configs/EmptyLinesConfig'
import { ChangeCaseConfig } from './step-configs/ChangeCaseConfig'
import { SortLinesConfig } from './step-configs/SortLinesConfig'
import { JoinSplitConfig } from './step-configs/JoinSplitConfig'
import { DedupeLinesConfig } from './step-configs/DedupeLinesConfig'
import { NumberLinesConfig } from './step-configs/NumberLinesConfig'
import { WrapLinesConfig } from './step-configs/WrapLinesConfig'
import { WordWrapConfig } from './step-configs/WordWrapConfig'
import { IndentConfig } from './step-configs/IndentConfig'
import { ExtractMatchesConfig } from './step-configs/ExtractMatchesConfig'
import { LineMatchConfig } from './step-configs/LineMatchConfig'
import { RemoveCharsConfig } from './step-configs/RemoveCharsConfig'
import { EncodeDecodeConfig } from './step-configs/EncodeDecodeConfig'
import { EscapeConfig } from './step-configs/EscapeConfig'
import { PadAlignConfig } from './step-configs/PadAlignConfig'
import { FormatNumbersConfig } from './step-configs/FormatNumbersConfig'
import { IncrementNumbersConfig } from './step-configs/IncrementNumbersConfig'
import { QuoteConfig } from './step-configs/QuoteConfig'

interface TransformerStepProps {
  step: PipelineStep
  index: number
  onUpdate: (id: string, config: Record<string, unknown>) => void
  onRemove: (id: string) => void
  onToggle: (id: string) => void
  onDragStart: (index: number) => void
  onDragEnter: (index: number) => void
  onDragEnd: () => void
}

// Operations that support line-by-line mode
const LINE_MODE_OPERATIONS = ['trim', 'change-case', 'replace', 'slugify', 'quote']

/**
 * Component representing a single step in a transformation pipeline.
 * @param props - Component props
 * @returns Transformer step component
 */
export function TransformerStep({
  step,
  index,
  onUpdate,
  onRemove,
  onToggle,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: TransformerStepProps): ReactElement | null {
  const [showConfig, setShowConfig] = useState(true) // Default open configuration

  const operation = OPERATIONS.find((op) => op.id === step.operationId)
  if (!operation) return null

  const Icon = ICON_MAP[operation.icon]

  /* 
     Determine if this operation has any configurable options.
     We check if the renderConfig returns null, but we need to know *before* rendering.
     Simpler check: these operations have no config in this app.
  */
  const hasConfig = !['unique'].includes(step.operationId)
  const supportsLineMode = LINE_MODE_OPERATIONS.includes(step.operationId)
  const isLineMode = step.config.lines !== false // Default to true

  const handleConfigChange = (newConfig: Record<string, unknown>) => {
    onUpdate(step.id, newConfig)
  }

  const toggleLineMode = () => {
    onUpdate(step.id, { ...step.config, lines: !isLineMode })
  }

  const renderConfig = () => {
    switch (step.operationId) {
      case 'replace':
        return <ReplaceConfig config={step.config} onChange={handleConfigChange} />

      case 'trim':
        return <TrimConfig config={step.config} onChange={handleConfigChange} />

      case 'filter-lines':
        return <EmptyLinesConfig config={step.config} onChange={handleConfigChange} />

      case 'change-case':
        return <ChangeCaseConfig config={step.config} onChange={handleConfigChange} />

      case 'sort-lines':
        return <SortLinesConfig config={step.config} onChange={handleConfigChange} />

      case 'join-lines':
      case 'split-lines':
        return (
          <JoinSplitConfig
            config={step.config}
            onChange={handleConfigChange}
            operationId={step.operationId}
          />
        )
      case 'dedupe-lines':
        return <DedupeLinesConfig config={step.config} onChange={handleConfigChange} />
      case 'number-lines':
        return <NumberLinesConfig config={step.config} onChange={handleConfigChange} />
      case 'wrap-lines':
        return <WrapLinesConfig config={step.config} onChange={handleConfigChange} />
      case 'word-wrap':
        return <WordWrapConfig config={step.config} onChange={handleConfigChange} />
      case 'indent':
        return <IndentConfig config={step.config} onChange={handleConfigChange} />
      case 'extract-matches':
        return <ExtractMatchesConfig config={step.config} onChange={handleConfigChange} />
      case 'keep-lines':
      case 'remove-lines':
        return <LineMatchConfig config={step.config} onChange={handleConfigChange} />
      case 'remove-chars':
        return <RemoveCharsConfig config={step.config} onChange={handleConfigChange} />
      case 'encode-decode':
        return <EncodeDecodeConfig config={step.config} onChange={handleConfigChange} />
      case 'escape':
        return <EscapeConfig config={step.config} onChange={handleConfigChange} />
      case 'pad-align':
        return <PadAlignConfig config={step.config} onChange={handleConfigChange} />
      case 'format-numbers':
        return <FormatNumbersConfig config={step.config} onChange={handleConfigChange} />
      case 'increment-numbers':
        return <IncrementNumbersConfig config={step.config} onChange={handleConfigChange} />
      case 'quote':
        return <QuoteConfig config={step.config} onChange={handleConfigChange} />

      default:
        return null
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent scrolling when starting drag on handle
    if (e.cancelable) e.preventDefault()
    onDragStart(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent scrolling
    const touch = e.touches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    const stepElement = target?.closest('[data-index]') as HTMLElement

    if (stepElement && stepElement.dataset.index) {
      const targetIndex = parseInt(stepElement.dataset.index, 10)
      if (!isNaN(targetIndex)) {
        onDragEnter(targetIndex)
      }
    }
  }

  const handleTouchEnd = () => {
    onDragEnd()
  }

  return (
    <div
      data-index={index}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border bg-card transition-all duration-200 w-full max-w-full min-w-0',
        step.enabled
          ? 'shadow-sm border-muted-foreground/10 hover:border-primary/30'
          : 'opacity-60 border-transparent bg-muted/5'
      )}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.stopPropagation()}
    >
      {/* Drag Handle - Aligned with icon */}
      <div
        className="mt-2 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors self-start pt-0.5 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'p-2 rounded-lg transition-colors mt-0',
          step.enabled ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between h-8">
          <span
            className={cn(
              'font-medium text-sm transition-colors',
              step.enabled ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {operation.name}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {supportsLineMode && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn('h-7 w-7', isLineMode && 'bg-muted')}
                onClick={toggleLineMode}
                title={
                  isLineMode
                    ? 'Apply to Each Line (click for Whole Selection)'
                    : 'Apply to Whole Selection (click for Each Line)'
                }
              >
                {isLineMode ? (
                  <WrapText className="h-3.5 w-3.5" />
                ) : (
                  <TextSelect className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            {hasConfig && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn('h-7 w-7', showConfig && 'bg-muted text-foreground')}
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
