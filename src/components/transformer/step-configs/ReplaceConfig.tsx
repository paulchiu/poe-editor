import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface ReplaceConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function ReplaceConfig({ config, onChange }: ReplaceConfigProps): ReactElement {
  return (
    <div className="grid gap-2 mt-3 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Find
          </label>
          <Input
            value={(config.from as string) || ''}
            onChange={(e) => onChange({ ...config, from: e.target.value })}
            placeholder="Text to find..."
            className="h-8 text-xs bg-muted/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Replace With
          </label>
          <Input
            value={(config.to as string) || ''}
            onChange={(e) => onChange({ ...config, to: e.target.value })}
            placeholder="Replacement..."
            className="h-8 text-xs bg-muted/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={!!config.regex}
            onChange={(e) => onChange({ ...config, regex: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Use Regex
        </label>

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
