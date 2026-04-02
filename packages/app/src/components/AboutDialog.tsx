import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { ReactElement } from 'react'

/**
 * GitHub logo SVG icon, replacing the removed lucide-react Github icon (dropped in v1.x)
 */
function GitHubIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

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
            <h3 className="font-semibold text-sm">Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Live preview with split-pane layout</li>
              <li>Vim mode</li>
              <li>Dark and light theme support</li>
              <li>Export to Markdown or HTML</li>
              <li>URL-based document persistence</li>
              <li>Custom text transformers</li>
              <li>Transformers import/export</li>
              <li>Markdown table tools</li>
              <li>Mermaid diagram support</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p className="font-semibold mb-2">Version {__APP_VERSION__}</p>
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
                <GitHubIcon className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
