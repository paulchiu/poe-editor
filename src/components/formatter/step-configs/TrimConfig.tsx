import type { ReactElement } from 'react'

interface TrimConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function TrimConfig(_props: TrimConfigProps): ReactElement | null {
  // Line mode toggle is now in the card header
  // No additional config options for trim
  return null
}
