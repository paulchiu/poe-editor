import type { ReactElement } from 'react'
import { cn } from '@/utils/classnames'

interface ChangeCaseConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Configuration component for Change Case operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function ChangeCaseConfig({ config, onChange }: ChangeCaseConfigProps): ReactElement {
  return (
    <div className="mt-3">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Case Mode
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
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
      </div>
    </div>
  )
}
