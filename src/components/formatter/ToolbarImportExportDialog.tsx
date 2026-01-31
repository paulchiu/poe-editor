import { useState, useCallback, useRef, type ReactElement } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { Copy, Download, Upload, AlertCircle, Trash2 } from 'lucide-react'
import { createToolbarExport, parseToolbarImport } from './toolbarSchema'
import { cn } from '@/utils/classnames'
import type { TransformationPipeline } from './types'

interface ToolbarImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelines: TransformationPipeline[]
  onImport: (pipelines: TransformationPipeline[]) => void
}

/**
 * Dialog for importing and exporting toolbar configuration.
 * @param props - Component props
 * @returns Dialog component
 */
export function ToolbarImportExportDialog({
  open,
  onOpenChange,
  pipelines,
  onImport,
}: ToolbarImportExportDialogProps): ReactElement {
  const { toast } = useToast()
  const [jsonText, setJsonText] = useState(() => {
    const exportData = createToolbarExport(pipelines)
    return JSON.stringify(exportData, null, 2)
  })
  const [error, setError] = useState<string | null>(null)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      toast({
        description: 'Configuration copied to clipboard!',
      })
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to copy to clipboard',
      })
    }
  }, [jsonText, toast])

  const handleUpdate = useCallback(() => {
    try {
      setError(null)
      const importedPipelines = parseToolbarImport(jsonText)
      onImport(importedPipelines)
      onOpenChange(false)
      toast({
        description: 'Configuration updated successfully!',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'Please check the configuration format.',
      })
    }
  }, [jsonText, onImport, onOpenChange, toast])

  const handleClear = useCallback(() => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true)
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false)
      }, 3000)
      return
    }

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    setIsConfirmingClear(false)

    const emptyExport = createToolbarExport([])
    setJsonText(JSON.stringify(emptyExport, null, 2))
    setError(null)
    toast({
      description: 'Configuration reset to empty. Click "Update Configuration" to save.',
    })
  }, [isConfirmingClear, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <DialogTitle>Import / Export Toolbar</DialogTitle>
          </div>
          <DialogDescription>
            Export your current pipelines or paste a new configuration to update them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[300px] flex flex-col gap-4 py-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Configuration (JSON)
              </label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
            </div>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste configuration JSON here..."
              className="flex-1 font-mono text-xs resize-none bg-muted/30"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="leading-tight">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant={isConfirmingClear ? 'destructive' : 'ghost'}
            onClick={handleClear}
            className={cn(
              !isConfirmingClear &&
                'text-destructive hover:text-destructive hover:bg-destructive/10',
              'gap-1.5 mr-auto transition-all'
            )}
          >
            {isConfirmingClear ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isConfirmingClear ? 'Are you sure?' : 'Clear Toolbar'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleUpdate} className="gap-1.5">
            <Upload className="w-4 h-4" />
            Update Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
