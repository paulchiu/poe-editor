import { Input } from '@/components/ui/input'
import type { ReactElement } from 'react'

interface IncrementNumbersConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Configuration component for Increment Numbers operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function IncrementNumbersConfig({
  config,
  onChange,
}: IncrementNumbersConfigProps): ReactElement {
  return (
    <div className="mt-3 ">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Increment By
        </label>
        <Input
          type="number"
          value={(config.delta as number) ?? 1}
          onChange={(e) => onChange({ ...config, delta: parseFloat(e.target.value) || 0 })}
          className="h-8 text-xs bg-muted/20 max-w-[100px]"
        />
      </div>
    </div>
  )
}
