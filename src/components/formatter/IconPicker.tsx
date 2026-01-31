import { useState } from 'react'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COMMON_ICONS, ICON_MAP } from './constants'
import { cn } from '@/utils/classnames'

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Resolve the current icon component if it exists in our map
  const CurrentIcon = ICON_MAP[value]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-10 h-10 p-0 text-xl flex-shrink-0"
        >
          {CurrentIcon ? <CurrentIcon className="w-5 h-5" /> : (value || '🪄')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" onInteractOutside={(e) => {
        // Prevent closing if interacting with internal elements, though popover usually handles this.
        // The issue might be focus related.
      }}>
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Text / Emoji</h4>
            <div className="flex gap-2">
              <Input 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type emoji or text..."
                className="h-8"
                // Ensure it doesn't close on click
                onClick={(e) => e.stopPropagation()}
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
                    "p-1.5 rounded-md hover:bg-accent hover:text-foreground transition-colors flex items-center justify-center",
                    value === label ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
