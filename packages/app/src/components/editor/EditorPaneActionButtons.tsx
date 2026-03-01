import type { ReactElement } from 'react'
import { Check, Copy, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface EditorPaneActionButtonsProps {
  copied: boolean
  viewMode?: 'editor' | 'preview' | 'split'
  onCopy: () => void
  onToggleLayout?: () => void
}

/**
 * Renders editor overlay action buttons for layout toggle and copy.
 * @param props - Button state and callback handlers
 * @returns Overlay action button group
 */
export function EditorPaneActionButtons({
  copied,
  viewMode,
  onCopy,
  onToggleLayout,
}: EditorPaneActionButtonsProps): ReactElement {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onToggleLayout && viewMode && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleLayout}
              className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border text-foreground"
            >
              {viewMode === 'split' ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{viewMode === 'split' ? 'Expand Editor' : 'Restore Split View'}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCopy}
            className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border text-foreground"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Copy Markdown</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
