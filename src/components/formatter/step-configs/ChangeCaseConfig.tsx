import type { ReactElement } from 'react'
import { cn } from '@/utils/classnames'

interface ChangeCaseConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function ChangeCaseConfig({ config, onChange }: ChangeCaseConfigProps): ReactElement {
  return (
    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Case Mode
        </label>
        <div className="grid grid-cols-4 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
          {[
            { id: 'upper', label: 'UPPER' },
            { id: 'lower', label: 'lower' },
            { id: 'title', label: 'Title Case' },
            { id: 'camel', label: 'camelCase' },
            { id: 'snake', label: 'snake_case' },
            { id: 'kebab', label: 'kebab-case' },
            { id: 'pascal', label: 'PascalCase' },
            { id: 'constant', label: 'CONST_CASE' },
          ].map((mode) => (
            <button
              key={mode.id}
              className={cn(
                'py-1.5 px-2 rounded-sm transition-colors text-center text-[10px] truncate',
                config.mode === mode.id
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              onClick={() => onChange({ ...config, mode: mode.id })}
              title={`Convert to ${mode.label}`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 h-7 px-2 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors w-fit mt-1">
          <input
            type="checkbox"
            checked={config.lines !== false} // Default to true if undefined
            onChange={(e) => onChange({ ...config, lines: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Apply to Each Line
        </label>
      </div>
    </div>
  )
}
