import type { ReactElement, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/utils/classnames'
import type { EmojiPickerState } from './editorPaneTypes'

interface EmojiEntry {
  shortcode: string
  emoji: string
}

interface EditorPaneEmojiPickerProps {
  enabled: boolean
  state: EmojiPickerState | null
  pickerRef: RefObject<HTMLDivElement | null>
  isLoading: boolean
  loadError: string | null
  entries: EmojiEntry[]
  selectedIndex: number
  onHoverIndex: (index: number) => void
  onSelectShortcode: (shortcode: string) => void
}

/**
 * Renders the emoji shortcode picker popover used by the editor.
 * @param props - Picker state, entries, and interaction handlers
 * @returns Emoji picker popover or null when hidden
 */
export function EditorPaneEmojiPicker({
  enabled,
  state,
  pickerRef,
  isLoading,
  loadError,
  entries,
  selectedIndex,
  onHoverIndex,
  onSelectShortcode,
}: EditorPaneEmojiPickerProps): ReactElement | null {
  if (!enabled || !state) {
    return null
  }

  return (
    <div
      ref={pickerRef}
      className="absolute z-20 w-80 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
      style={{ top: state.top, left: state.left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {isLoading && <p className="px-2 py-2 text-xs text-muted-foreground">Loading emojis...</p>}
      {!isLoading && loadError && <p className="px-2 py-2 text-xs text-destructive">{loadError}</p>}
      {!isLoading && !loadError && (
        <ScrollArea className="h-56">
          <div className="space-y-1 pr-2">
            {entries.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No emoji matches for :{state.query}
              </p>
            )}
            {entries.map((entry, index) => (
              <Button
                key={entry.shortcode}
                type="button"
                variant="ghost"
                className={cn('w-full justify-start gap-2', index === selectedIndex && 'bg-accent text-foreground')}
                aria-label={`Insert :${entry.shortcode}:`}
                aria-selected={index === selectedIndex}
                onMouseEnter={() => onHoverIndex(index)}
                onClick={() => onSelectShortcode(entry.shortcode)}
              >
                <span className="text-base leading-none">{entry.emoji}</span>
                <span className="font-mono text-xs text-foreground">:{entry.shortcode}:</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
