import { type ReactElement, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface NewDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Dialog to confirm creating a new document
 * @param props - Component props
 * @returns NewDocumentDialog component
 */
export function NewDocumentDialog({
  open,
  onOpenChange,
  onConfirm,
}: NewDocumentDialogProps): ReactElement {
  const continueRef = useRef<HTMLButtonElement>(null)

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          setTimeout(() => {
            continueRef.current?.focus()
          }, 0)
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Create new document?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear the current editor content. Any unsaved changes (not in the URL) will be
            lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction ref={continueRef} onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
