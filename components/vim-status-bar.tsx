'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type VimMode = 'normal' | 'insert' | 'visual' | 'command'

interface VimStatusBarProps {
  mode: VimMode
  filePath?: string
  modified?: boolean
  lineNumber?: number
  columnNumber?: number
  className?: string
}

const modeConfig: Record<
  VimMode,
  {
    label: string
    bgColor: string
    textColor: string
  }
> = {
  normal: {
    label: 'NORMAL',
    bgColor: 'bg-blue-900/30',
    textColor: 'text-blue-400',
  },
  insert: {
    label: 'INSERT',
    bgColor: 'bg-green-900/30',
    textColor: 'text-green-400',
  },
  visual: {
    label: 'VISUAL',
    bgColor: 'bg-purple-900/30',
    textColor: 'text-purple-400',
  },
  command: {
    label: 'COMMAND',
    bgColor: 'bg-amber-900/30',
    textColor: 'text-amber-400',
  },
}

export function VimStatusBar({
  mode,
  filePath = 'untitled.md',
  modified = false,
  lineNumber = 1,
  columnNumber = 1,
  className,
}: VimStatusBarProps) {
  const config = modeConfig[mode]

  return (
    <div
      className={cn(
        'h-6 flex items-center justify-between px-4 font-mono text-xs border-t border-border bg-muted/30',
        className
      )}
      role="status"
      aria-label={`Vim mode: ${config.label}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mode indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={cn('w-2 h-2 rounded-full transition-colors duration-200', config.bgColor)}
            aria-hidden="true"
          />
          <span className={cn('font-semibold', config.textColor)}>{config.label}</span>
        </div>

        {/* File info */}
        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          <span className="truncate max-w-[200px]">{filePath}</span>
          {modified && (
            <span className="text-amber-400" aria-label="File modified">
              ●
            </span>
          )}
        </div>
      </div>

      {/* Position info */}
      <div className="flex items-center gap-4 text-muted-foreground flex-shrink-0">
        <span aria-label={`Line ${lineNumber}, Column ${columnNumber}`}>
          {lineNumber}:{columnNumber}
        </span>
      </div>
    </div>
  )
}
