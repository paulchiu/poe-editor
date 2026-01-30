import { useState, useRef, useEffect, type ReactElement, type SyntheticEvent, type FormEvent } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { FocusScope } from '@radix-ui/react-focus-scope'
import { XIcon } from 'lucide-react'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/classnames'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onRename: (newName: string) => void
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  onRename,
}: RenameDialogProps): ReactElement {
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasSetInitialSelection = useRef(false)
  const expectedSelectionEnd = useRef<number | null>(null)

  // Reset name and refs when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName)
      hasSetInitialSelection.current = false
      expectedSelectionEnd.current = null
    }
  }, [open, currentName])

  const handleOpenAutoFocus = (e: Event) => {
    e.preventDefault()

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return

      input.focus()

      const dotIndex = input.value.lastIndexOf('.')
      if (dotIndex !== -1) {
        input.setSelectionRange(0, dotIndex)
        expectedSelectionEnd.current = dotIndex
        hasSetInitialSelection.current = true
      } else {
        input.select()
      }

      // Disable auto-correction after a short delay
      setTimeout(() => {
        hasSetInitialSelection.current = false
      }, 300)
    })
  }

  const handleSelect = (e: SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget

    // Check if we need to correct a "select all" event
    if (hasSetInitialSelection.current && expectedSelectionEnd.current !== null) {
      if (
        input.selectionStart === 0 &&
        input.selectionEnd === input.value.length &&
        input.selectionEnd !== expectedSelectionEnd.current
      ) {
        // Restore the desired selection (filename only)
        input.setSelectionRange(0, expectedSelectionEnd.current)
      }
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onRename(name.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <FocusScope trapped={false}>
          <DialogPrimitive.Content
            className={cn(
              'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
              'sm:max-w-[425px]'
            )}
            onOpenAutoFocus={handleOpenAutoFocus}
          >
            <DialogHeader>
              <DialogTitle>Rename Document</DialogTitle>
              <DialogDescription>
                Enter a new name for your document.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <Input
                  ref={inputRef}
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="filename.md"
                  autoComplete="off"
                  onSelect={handleSelect}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim()}>
                  Rename
                </Button>
              </DialogFooter>
            </form>
            <DialogPrimitive.Close
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </FocusScope>
      </DialogPortal>
    </Dialog>
  )
}

