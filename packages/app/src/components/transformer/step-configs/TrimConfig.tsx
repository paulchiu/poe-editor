import type { ReactElement } from 'react'

interface TrimConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Configuration component for Trim Whitespace operation.
 * @param props - Component props
 * @returns The configuration component
 */
export function TrimConfig(_props: TrimConfigProps): ReactElement | null {
  // Line mode toggle is now in the card header
  // No additional config options for trim
  return null
}
