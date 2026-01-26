import { useEffect } from 'react'

interface ShortcutHandlers {
  onBold: () => void
  onItalic: () => void
  onLink: () => void
  onCode: () => void
  onCodeBlock: () => void
  onSave: () => void
  onHelp: () => void
}

/**
 * Sets up global keyboard shortcuts for the editor.
 * Supports both modifier-based shortcuts (Cmd/Ctrl+key) and regular shortcuts (e.g., ?).
 * @param handlers - Object containing callback functions for each keyboard shortcut action
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Detect Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = event.metaKey || event.ctrlKey

      // Check if focus is in a regular input/textarea (not Monaco)
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'

      // Allow shortcuts in Monaco editor (it has its own keybindings, but we want ours too)
      const isMonaco =
        typeof target.closest === 'function' ? target.closest('.monaco-editor') : false

      // Skip if in regular input (but allow in Monaco for modifier shortcuts)
      if (isInput && !isMonaco) {
        return
      }

      // Handle modifier-based shortcuts
      if (isMod) {
        // Shift + K for code block (check first to prevent conflict with Cmd+K)
        if (event.shiftKey && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          handlers.onCodeBlock()
          return
        }

        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault()
            handlers.onBold()
            break
          case 'i':
            event.preventDefault()
            handlers.onItalic()
            break
          case 'k':
            event.preventDefault()
            handlers.onLink()
            break
          case 'e':
            event.preventDefault()
            handlers.onCode()
            break
          case 's':
            event.preventDefault()
            handlers.onSave()
            break
        }
      }

      // Handle non-modifier shortcuts (only outside editor/inputs)
      if (!isMod && !event.altKey && !isMonaco) {
        if (event.key === '?') {
          event.preventDefault()
          handlers.onHelp()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
