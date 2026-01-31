import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface DedupeConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function DedupeConfig({ config, onChange }: DedupeConfigProps): ReactElement {
  const keep = (config.keep as string) || 'first'

  return (
    <div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Occurrence to Keep
        </label>
        <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
          {[
            { id: 'first', label: 'First' },
            { id: 'last', label: 'Last' },
          ].map((opt) => (
            <button
              key={opt.id}
              className={cn(
                'py-1.5 px-2 rounded-sm transition-colors text-center',
                keep === opt.id
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              onClick={() => onChange({ ...config, keep: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={config.caseSensitive !== false}
            onChange={(e) => onChange({ ...config, caseSensitive: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Case Sensitive
        </label>
      </div>
    </div>
  )
}
