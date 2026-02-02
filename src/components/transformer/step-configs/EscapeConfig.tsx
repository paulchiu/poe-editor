import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface EscapeConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function EscapeConfig({ config, onChange }: EscapeConfigProps): ReactElement {
  const mode = (config.mode as string) || 'json-escape'

  // Parse type and operation from mode
  const [type, operation] = mode.includes('-')
    ? (mode.split('-') as [string, string])
    : ['json', 'escape']

  const typeOptions = [
    { id: 'json', label: 'JSON' },
    { id: 'regex', label: 'Regex' },
  ]

  const operationOptions = [
    { id: 'escape', label: 'Escape' },
    { id: 'unescape', label: 'Unescape' },
  ]

  const handleTypeChange = (newType: string) => {
    // If switching to regex, force escape operation (regex doesn't support unescape)
    const newOperation = newType === 'regex' ? 'escape' : operation
    const newMode = `${newType}-${newOperation}`
    onChange({ ...config, mode: newMode })
  }

  const handleOperationChange = (newOperation: string) => {
    const newMode = `${type}-${newOperation}`
    onChange({ ...config, mode: newMode })
  }

  return (
    <div className="grid gap-2 mt-3 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Type
          </label>
          <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
            {typeOptions.map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'py-1.5 px-2 rounded-sm transition-colors text-center',
                  type === opt.id
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => handleTypeChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Operation
          </label>
          <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
            {operationOptions.map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'py-1.5 px-2 rounded-sm transition-colors text-center',
                  operation === opt.id
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  // Disable unescape for regex
                  type === 'regex' && opt.id === 'unescape' && 'opacity-40 cursor-not-allowed'
                )}
                onClick={() => handleOperationChange(opt.id)}
                disabled={type === 'regex' && opt.id === 'unescape'}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
