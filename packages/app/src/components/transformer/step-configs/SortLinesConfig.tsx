import type { ReactElement } from 'react'
import { cn } from '@/utils/classnames'

interface SortLinesConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Configuration component for Sort Lines operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function SortLinesConfig({ config, onChange }: SortLinesConfigProps): ReactElement {
  return (
    <div className="flex flex-col md:flex-row gap-3 mt-3 text-left items-stretch md:items-end">
      <div className="flex-1 space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Direction
        </label>
        <div className="flex bg-muted/20 p-1 rounded-md border text-xs h-[34px] items-center">
          {['asc', 'desc'].map((dir) => (
            <button
              key={dir}
              className={cn(
                'flex-1 py-1 rounded-sm capitalize transition-colors h-full flex items-center justify-center',
                config.direction === dir
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onChange({ ...config, direction: dir })}
            >
              {dir === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
          &nbsp;
        </label>
        <label className="flex items-center gap-2 h-[34px] px-3 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={!!config.numeric}
            onChange={(e) => onChange({ ...config, numeric: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Numeric Sort
        </label>
      </div>
    </div>
  )
}
