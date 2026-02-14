import { useEffect } from 'react'

interface ShortcutHandlers {
  onBold: () => void
  onItalic: () => void
  onLink: () => void
  onCode: () => void
  onCodeBlock: () => void
  onSave: () => void
  onHelp: () => void
  onNew: () => void
  onRename: () => void
  onClear: () => void
  onCopyLink: () => void
  onReset: () => void
  onHeading: (level: number) => void
  onQuote: () => void
  onBulletList: () => void
  onNumberedList: () => void
  onTable: () => void
  onTransform: () => void
  onDownload: () => void
  onFocusEditor: () => void
  onFocusDocument: () => void
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
      const isAlt = event.altKey

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
      // Also allow App shortcuts (Cmd+Alt) to bypass input check
      const isAppShortcut = isMod && isAlt

      if (isInput && !isMonaco && !isAppShortcut) {
        // Allow F2 in inputs (e.g. rename)
        if (event.key !== 'F2') {
          return
        }
      }

      // Handle modifier-based shortcuts
      if (isMod) {
        // Shift + K for code block
        if (event.shiftKey) {
          switch (event.key.toLowerCase()) {
            case 'k':
              event.preventDefault()
              handlers.onCodeBlock()
              return
            case 's':
              event.preventDefault()
              handlers.onDownload()
              return
            case 'u':
              event.preventDefault()
              handlers.onBulletList()
              return
            case 'o':
              event.preventDefault()
              handlers.onNumberedList()
              return
            case 't':
              event.preventDefault()
              handlers.onTable()
              return
            case 'm':
              event.preventDefault()
              handlers.onTransform()
              return
          }
        }

        // App-level shortcuts (Cmd+Alt+...)
        if (isAlt) {
          // Use event.code for reliable detection across layouts (ignoring Option key side-effects on character output)
          // macOS: Option acts as Alt.
          switch (event.code) {
            case 'KeyN':
              event.preventDefault()
              handlers.onNew()
              break
            case 'KeyR':
              event.preventDefault()
              handlers.onRename()
              break
            case 'KeyL':
              event.preventDefault()
              handlers.onCopyLink()
              break
            case 'KeyK':
              event.preventDefault()
              handlers.onClear()
              break
            case 'Digit0':
              event.preventDefault()
              handlers.onReset()
              break
            // Headings
            case 'Digit1':
              event.preventDefault()
              handlers.onHeading(1)
              break
            case 'Digit2':
              event.preventDefault()
              handlers.onHeading(2)
              break
            case 'Digit3':
              event.preventDefault()
              handlers.onHeading(3)
              break
            // Quote (Cmd+Opt+B)
            case 'KeyB':
              event.preventDefault()
              handlers.onQuote()
              break
            // Focus Editor (Cmd+Opt+E)
            case 'KeyE':
              event.preventDefault()
              handlers.onFocusEditor()
              break
            // Focus Document Menu (Cmd+Opt+A)
            case 'KeyA':
              event.preventDefault()
              handlers.onFocusDocument()
              break
          }
          return
        }

        // Standard formatting shortcuts
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

      // Handle non-modifier shortcuts
      if (!isMod && !isAlt && !isMonaco) {
        if (event.key === '?') {
          event.preventDefault()
          handlers.onHelp()
        }
      }

      // Function keys
      if (event.key === 'F2') {
        event.preventDefault()
        handlers.onRename()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
