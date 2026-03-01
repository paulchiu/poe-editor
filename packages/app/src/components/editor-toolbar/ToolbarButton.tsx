import { type ElementType, forwardRef } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/classnames'

interface ToolbarButtonProps {
  icon: ElementType
  label: string
  onClick?: () => void
  active?: boolean
  allowDrag?: boolean
  className?: string
  dragAttributes?: DraggableAttributes
  dragListeners?: SyntheticListenerMap
  tooltipDisabled?: boolean
}

/**
 * Individual toolbar button with an optional tooltip wrapper.
 * @param props - Component props.
 * @returns Toolbar button element.
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      icon: Icon,
      label,
      onClick,
      active = false,
      allowDrag = false,
      className,
      dragAttributes,
      dragListeners,
      tooltipDisabled,
    },
    ref
  ) => {
    const button = (
      <Button
        ref={ref}
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        onMouseDown={allowDrag ? undefined : (event) => event.preventDefault()}
        style={{ touchAction: allowDrag ? 'none' : undefined }}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          active && 'bg-accent text-foreground',
          className
        )}
        {...dragAttributes}
        {...dragListeners}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    )

    if (tooltipDisabled) {
      return button
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }
)
ToolbarButton.displayName = 'ToolbarButton'
