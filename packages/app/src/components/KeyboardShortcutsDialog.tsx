import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ReactElement } from 'react'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vimModeEnabled: boolean
}

/**
 * Keyboard shortcuts reference dialog
 * @param props - Component props
 * @returns Keyboard shortcuts dialog component
 */
export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  vimModeEnabled,
}: KeyboardShortcutsDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Reference guide for all keyboard shortcuts</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-6 pr-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Formatting</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Bold</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Cmd/Ctrl + B</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Italic</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Cmd/Ctrl + I</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Code</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Cmd/Ctrl + E</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Link</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Cmd/Ctrl + K</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Heading 1/2/3</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Opt + 1/2/3
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Quote</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Opt + B
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Bullet List</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + U
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Numbered List</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + O
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Format Table</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + T
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Transform Selection</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + M
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Code Block</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + K
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Document</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">New Document</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Opt + N
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Download (Markdown)</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Shift + S
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Rename</span>
                  <div className="flex gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + Alt + R
                    </code>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">F2</code>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Copy Link</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Alt + L
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Clear Document</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Alt + K
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Application</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Focus Editor</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Opt + E
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Focus Document Menu</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Opt + A
                  </code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Save</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Cmd/Ctrl + S</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Help</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">?</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Close Modal</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Reset App State</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    Cmd/Ctrl + Alt + 0
                  </code>
                </div>
              </div>
            </div>

            {vimModeEnabled && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Vim Mode</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enter Normal Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enter Insert Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">i / a</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enter Visual Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">v</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
