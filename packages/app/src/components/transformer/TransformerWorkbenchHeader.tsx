import type { ReactElement } from 'react'
import { Code, FileJson, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/classnames'

interface TransformerWorkbenchHeaderProps {
  stepCount: number
  mode: 'gui' | 'json'
  isValidJson: boolean
  canToggleMode: boolean
  onModeToggle: () => void
}

/**
 * Renders the transformer workbench header with mode toggle controls.
 * @param props - Header display state and handlers.
 * @returns Header component.
 */
export function TransformerWorkbenchHeader({
  stepCount,
  mode,
  isValidJson,
  canToggleMode,
  onModeToggle,
}: TransformerWorkbenchHeaderProps): ReactElement {
  return (
    <div className="p-4 border-b bg-background flex justify-between items-center shrink-0">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Pipeline
        <span className="text-xs font-normal normal-case bg-muted px-2 py-0.5 rounded-full text-foreground">
          {stepCount} steps
        </span>
      </h3>

      {canToggleMode && (
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onModeToggle}
                  className={cn(
                    'h-8 w-8',
                    mode === 'json'
                      ? !isValidJson
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground'
                  )}
                >
                  {mode === 'gui' ? <FileJson className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {mode === 'gui'
                ? 'Edit as JSON'
                : !isValidJson
                  ? 'Fix schema errors to switch view'
                  : 'Switch to GUI'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
