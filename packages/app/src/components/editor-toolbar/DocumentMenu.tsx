import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FilePlus,
  FileText,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/classnames'
import type { EditorToolbarProps } from '@/components/editor-toolbar/types'

type DocumentMenuProps = Pick<
  EditorToolbarProps,
  | 'documentName'
  | 'documentMenuRef'
  | 'isOverLimit'
  | 'onNew'
  | 'onRename'
  | 'onDownloadMarkdown'
  | 'onDownloadHTML'
  | 'onCopyLink'
  | 'onClear'
>

/**
 * Renders the document menu with file-level actions.
 * @param props - Component props.
 * @returns Document menu element.
 */
export function DocumentMenu({
  documentName,
  documentMenuRef,
  isOverLimit,
  onNew,
  onRename,
  onDownloadMarkdown,
  onDownloadHTML,
  onCopyLink,
  onClear,
}: DocumentMenuProps): ReactElement {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  const handleClearSelect = (event: Event): void => {
    if (!isConfirmingClear) {
      event.preventDefault()
      setIsConfirmingClear(true)
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
      clearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false)
      }, 3000)
      return
    }

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    setIsConfirmingClear(false)
    onClear()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={documentMenuRef}
          variant="ghost"
          className={cn(
            'gap-2 text-sm font-medium',
            isOverLimit && 'text-destructive hover:text-destructive hover:bg-destructive/20'
          )}
        >
          {isOverLimit ? <AlertTriangle className="size-4" /> : <FileText className="size-4" />}
          {documentName}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={onNew}>
          <FilePlus className="size-4" />
          New
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download className="size-4" />
            Download
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={onDownloadMarkdown}>
              <Download className="size-4" />
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadHTML}>
              <Download className="size-4" />
              HTML (.html)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onCopyLink}>
          <Link2 className="size-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleClearSelect}
          className={cn(
            isConfirmingClear &&
              'text-destructive bg-destructive/10 focus:bg-destructive/10 focus:text-destructive'
          )}
        >
          {isConfirmingClear ? (
            <AlertTriangle className="size-4 animate-pulse" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {isConfirmingClear ? 'Confirm Clear' : 'Clear'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
