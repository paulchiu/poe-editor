import { useState, type ReactElement } from 'react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COMMON_ICONS, ICON_MAP } from './constants'
import { cn } from '@/utils/classnames'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Picker component for selecting pipeline icons from predefined set or custom emoji.
 * @param props - Component props
 * @returns Icon picker component
 */
export function IconPicker({ value, onChange }: IconPickerProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)

  // Resolve the current icon component if it exists in our map
  const CurrentIcon = ICON_MAP[value]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-10 h-10 p-0 text-xl flex-shrink-0">
          {CurrentIcon ? <CurrentIcon className="w-5 h-5" /> : value || '🪄'}
        </Button>
      </PopoverTrigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="center"
          sideOffset={4}
          className={cn(
            'z-[60] rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'w-64 p-3'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Text / Emoji
              </h4>
              <div className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  // Stop propagation to prevent dnd-kit in parent TransformerDialog from capturing the event
                  // (due to React Portal bubbling) and preventing input focus.
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Type emoji or text..."
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Icons</h4>
              <div className="grid grid-cols-5 gap-1">
                {COMMON_ICONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => {
                      onChange(label)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'p-1.5 rounded-md hover:bg-accent hover:text-foreground transition-colors flex items-center justify-center',
                      value === label ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  )
}
