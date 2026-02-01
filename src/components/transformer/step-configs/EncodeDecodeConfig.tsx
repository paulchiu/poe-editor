import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'

interface EncodeDecodeConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function EncodeDecodeConfig({ config, onChange }: EncodeDecodeConfigProps): ReactElement {
  const mode = (config.mode as string) || 'url-encode'

  // Parse format and operation from mode
  const [format, operation] = mode.includes('-')
    ? (mode.split('-') as [string, string])
    : ['url', 'encode']

  const formatOptions = [
    { id: 'url', label: 'URL' },
    { id: 'base64', label: 'Base64' },
    { id: 'html', label: 'HTML' },
  ]

  const operationOptions = [
    { id: 'encode', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
  ]

  const handleFormatChange = (newFormat: string) => {
    const newMode = `${newFormat}-${operation}`
    onChange({ ...config, mode: newMode })
  }

  const handleOperationChange = (newOperation: string) => {
    const newMode = `${format}-${newOperation}`
    onChange({ ...config, mode: newMode })
  }

  return (
    <div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Format
          </label>
          <div className="grid grid-cols-3 gap-1 bg-muted/20 p-1 rounded-md border text-xs">
            {formatOptions.map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'py-1.5 px-1 rounded-sm transition-colors text-center truncate',
                  format === opt.id
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => handleFormatChange(opt.id)}
                title={opt.label}
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
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                onClick={() => handleOperationChange(opt.id)}
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
