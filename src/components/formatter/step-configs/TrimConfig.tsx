import type { ReactElement } from 'react'

interface TrimConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function TrimConfig({ config, onChange }: TrimConfigProps): ReactElement {
  return (
    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
      <label className="flex items-center gap-2 h-8 px-3 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors w-fit">
        <input
          type="checkbox"
          checked={!!config.lines}
          onChange={(e) => onChange({ ...config, lines: e.target.checked })}
          className="rounded border-input text-primary focus:ring-primary h-3 w-3"
        />
        Trim Each Line Individually
      </label>
    </div>
  )
}
