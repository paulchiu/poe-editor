import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ReactElement } from 'react'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">About Poe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Modal editing for Markdown</p>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Live preview with split-pane layout</li>
              <li>Vim mode</li>
              <li>Dark and light theme support</li>
              <li>Export to Markdown or HTML</li>
              <li>URL-based document persistence</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p className="font-semibold mb-1">Version 1.0.0</p>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
