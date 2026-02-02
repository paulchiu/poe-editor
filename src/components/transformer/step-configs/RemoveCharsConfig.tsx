import { Input } from '@/components/ui/input'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface RemoveCharsConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function RemoveCharsConfig({ config, onChange }: RemoveCharsConfigProps): ReactElement {
  const mode = (config.mode as string) || 'digits'

  return (
    <div className="grid gap-2 mt-3 ">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Characters to Strip
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-muted/20 p-1 rounded-md border text-[10px]">
          {[
            { id: 'digits', label: 'Digits' },
            { id: 'punctuation', label: 'Punct' },
            { id: 'non-ascii', label: 'Non-ASCII' },
            { id: 'custom', label: 'Custom' },
          ].map((opt) => (
            <button
              key={opt.id}
              className={cn(
                'py-1.5 px-1 rounded-sm transition-colors text-center truncate',
                mode === opt.id
                  ? 'bg-background shadow-sm text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              onClick={() => onChange({ ...config, mode: opt.id })}
              title={opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'custom' && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Custom Characters
          </label>
          <Input
            value={(config.custom as string) || ''}
            onChange={(e) => onChange({ ...config, custom: e.target.value })}
            placeholder="e.g. abc_@#"
            className="h-8 text-xs bg-muted/20 font-mono"
          />
        </div>
      )}
    </div>
  )
}
