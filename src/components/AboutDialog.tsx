import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Github } from 'lucide-react'
import type { ReactElement } from 'react'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * About dialog showing application information and credits
 * @param props - Component props
 * @returns About dialog component
 */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">About Poe</DialogTitle>
          <DialogDescription>Modal editing for Markdown</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Live preview with split-pane layout</li>
              <li>Vim mode</li>
              <li>Dark and light theme support</li>
              <li>Export to Markdown or HTML</li>
              <li>URL-based document persistence</li>
              <li>Custom text transformers</li>
              <li>Transformers import/export</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p className="font-semibold mb-2">Version 1.0.0</p>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <p className="mb-1">
                  Inspired by{' '}
                  <a
                    href="https://dillinger.io"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    dillinger.io
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://www.typescriptlang.org/play"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    TypeScript playground
                  </a>
                </p>
                <p>&copy; 2026 Paul Chiu</p>
              </div>
              <a
                href="https://github.com/paulchiu/poe-editor"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:underline shrink-0"
                aria-label="View source on GitHub"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
