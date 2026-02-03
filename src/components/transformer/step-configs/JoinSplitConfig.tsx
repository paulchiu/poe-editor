import type { ReactElement } from 'react'
import { Input } from '@/components/ui/input'

interface JoinSplitConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  operationId: string
}

/**
 * Configuration component for Join/Split operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function JoinSplitConfig({
  config,
  onChange,
  operationId,
}: JoinSplitConfigProps): ReactElement {
  // Determine placeholder based on operation
  const placeholder = operationId === 'join-lines' ? 'Space, comma, etc.' : 'Separator character'

  return (
    <div className="mt-3 ">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Separator
        </label>
        <Input
          value={(config.separator as string) || ''}
          onChange={(e) => onChange({ ...config, separator: e.target.value })}
          placeholder={placeholder}
          className="h-8 text-xs bg-muted/20 font-mono"
        />
      </div>
    </div>
  )
}
