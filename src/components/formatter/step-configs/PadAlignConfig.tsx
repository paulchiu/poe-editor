import { Input } from '@/components/ui/input'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface PadAlignConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function PadAlignConfig({ config, onChange }: PadAlignConfigProps): ReactElement {
  const align = (config.align as string) || 'left'

  return (
    <div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Alignment
          </label>
          <div className="grid grid-cols-3 gap-1 bg-muted/20 p-1 rounded-md border text-[10px]">
            {[
              { id: 'left', label: 'Left' },
              { id: 'center', label: 'Center' },
              { id: 'right', label: 'Right' },
            ].map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'py-1.5 px-1 rounded-sm transition-colors text-center truncate',
                  align === opt.id
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => onChange({ ...config, align: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Width
          </label>
          <Input
            type="number"
            value={(config.width as number) ?? 20}
            onChange={(e) => onChange({ ...config, width: parseInt(e.target.value) || 0 })}
            className="h-[38px] text-xs bg-muted/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Pad Character
        </label>
        <Input
          type="text"
          value={(config.char as string) || ' '}
          onChange={(e) => onChange({ ...config, char: e.target.value || ' ' })}
          onFocus={(e) => e.target.select()}
          placeholder="e.g. 0"
          className="h-8 text-xs bg-muted/20 font-mono w-[60px]"
          maxLength={1}
        />
      </div>
    </div>
  )
}
