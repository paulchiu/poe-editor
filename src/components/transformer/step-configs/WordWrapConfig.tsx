import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface WordWrapConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Configuration component for Word Wrap operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function WordWrapConfig({ config, onChange }: WordWrapConfigProps): ReactElement {
  return (
    <div className="mt-3 ">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Column Width
        </label>
        <Input
          type="number"
          value={(config.width as number) ?? 80}
          onChange={(e) => onChange({ ...config, width: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs bg-muted/20 max-w-[100px]"
        />
      </div>
    </div>
  )
}
