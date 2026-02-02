import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface NumberLinesConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function NumberLinesConfig({ config, onChange }: NumberLinesConfigProps): ReactElement {
  return (
    <div className="grid gap-2 mt-3 ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Start
          </label>
          <Input
            type="number"
            value={(config.start as number) ?? 1}
            onChange={(e) => onChange({ ...config, start: parseInt(e.target.value) || 0 })}
            className="h-8 text-xs bg-muted/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Prefix
          </label>
          <Input
            value={(config.prefix as string) || ''}
            onChange={(e) => onChange({ ...config, prefix: e.target.value })}
            placeholder="e.g. ("
            className="h-8 text-xs bg-muted/20 font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Separator
          </label>
          <Input
            value={(config.separator as string) ?? '. '}
            onChange={(e) => onChange({ ...config, separator: e.target.value })}
            placeholder="e.g. . "
            className="h-8 text-xs bg-muted/20 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
