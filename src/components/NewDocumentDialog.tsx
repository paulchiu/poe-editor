import type { ReactElement } from 'react'
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
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new document?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear the current editor content. Any unsaved changes (not in the URL) will be
            lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
