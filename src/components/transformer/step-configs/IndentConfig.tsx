import { Input } from '@/components/ui/input'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface IndentConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function IndentConfig({ config, onChange }: IndentConfigProps): ReactElement {
  const mode = config.mode === 'dedent' ? 'dedent' : 'indent'

  return (
    <div className="grid gap-2 mt-3 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
            {[
              { id: 'indent', label: 'Indent' },
              { id: 'dedent', label: 'Dedent' },
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
            Size
          </label>
          <Input
            type="number"
            value={(config.size as number) ?? 2}
            onChange={(e) => onChange({ ...config, size: parseInt(e.target.value) || 0 })}
            className="h-[38px] text-xs bg-muted/20"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={!!config.useTabs}
            onChange={(e) => onChange({ ...config, useTabs: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Use Tabs
        </label>
      </div>
    </div>
  )
}
