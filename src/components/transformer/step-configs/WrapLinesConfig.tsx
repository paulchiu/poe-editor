import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface WrapLinesConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function WrapLinesConfig({ config, onChange }: WrapLinesConfigProps): ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Prefix
        </label>
        <Input
          value={(config.prefix as string) || ''}
          onChange={(e) => onChange({ ...config, prefix: e.target.value })}
          placeholder="e.g. > "
          className="h-8 text-xs bg-muted/20 font-mono"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Suffix
        </label>
        <Input
          value={(config.suffix as string) || ''}
          onChange={(e) => onChange({ ...config, suffix: e.target.value })}
          placeholder="e.g. ,"
          className="h-8 text-xs bg-muted/20 font-mono"
        />
      </div>
    </div>
  )
}
