import { Input } from '@/components/ui/input'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface QuoteConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function QuoteConfig({ config, onChange }: QuoteConfigProps): ReactElement {
  const mode = (config.mode as string) || 'add'

  return (
    <div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-[10px]">
            {[
              { id: 'add', label: 'Add' },
              { id: 'remove', label: 'Remove' },
            ].map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'py-1.5 px-2 rounded-sm transition-colors text-center',
                  mode === opt.id
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => onChange({ ...config, mode: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Quote Char
          </label>
          <Input
            value={(config.char as string) || '"'}
            onChange={(e) => onChange({ ...config, char: e.target.value || '"' })}
            placeholder='e.g. "'
            className="h-[38px] text-xs bg-muted/20 font-mono w-[60px]"
            maxLength={1}
          />
        </div>
      </div>
    </div>
  )
}
