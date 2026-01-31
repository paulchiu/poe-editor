import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface FormatNumbersConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function FormatNumbersConfig({ config, onChange }: FormatNumbersConfigProps): ReactElement {
  return (
    <div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Decimal Places
        </label>
        <Input
          type="number"
          value={(config.decimals as number) ?? 2}
          onChange={(e) => onChange({ ...config, decimals: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs bg-muted/20 max-w-[80px]"
        />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={config.thousands !== false}
            onChange={(e) => onChange({ ...config, thousands: e.target.checked })}
            className="rounded border-input text-primary focus:ring-primary h-3 w-3"
          />
          Thousands Separator
        </label>
      </div>
    </div>
  )
}
