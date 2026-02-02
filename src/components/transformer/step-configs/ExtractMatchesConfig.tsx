import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface ExtractMatchesConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function ExtractMatchesConfig({
  config,
  onChange,
}: ExtractMatchesConfigProps): ReactElement {
  return (
    <div className="grid gap-2 mt-3 ">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Regex Pattern
        </label>
        <Input
          value={(config.pattern as string) || ''}
          onChange={(e) => onChange({ ...config, pattern: e.target.value })}
          placeholder="e.g. \d+"
          className="h-8 text-xs bg-muted/20 font-mono"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={!!config.caseInsensitive}
            onChange={(e) => onChange({ ...config, caseInsensitive: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Case Insensitive
        </label>
      </div>
    </div>
  )
}
