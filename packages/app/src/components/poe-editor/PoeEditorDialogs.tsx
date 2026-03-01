import type { Dispatch, ReactElement, SetStateAction } from 'react'
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
import { AboutDialog } from '@/components/AboutDialog'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { NewDocumentDialog } from '@/components/NewDocumentDialog'
import { RenameDialog } from '@/components/RenameDialog'
import { SplashScreen } from '@/components/SplashScreen'
import { TransformerDialog } from '@/components/transformer/TransformerDialog'
import { TransformerImportExportDialog } from '@/components/transformer/TransformerImportExportDialog'
import type { TransformationPipeline } from '@/components/transformer/types'

interface PoeEditorDialogsProps {
  showAbout: boolean
  setShowAbout: Dispatch<SetStateAction<boolean>>
  showTransformer: boolean
  setShowTransformer: Dispatch<SetStateAction<boolean>>
  editingPipeline: TransformationPipeline | null
  setEditingPipeline: Dispatch<SetStateAction<TransformationPipeline | null>>
  selectedText: string | undefined
  setSelectedText: Dispatch<SetStateAction<string | undefined>>
  onSavePipeline: (pipeline: TransformationPipeline) => void
  onApplyPipeline: (pipeline: TransformationPipeline) => void
  vimModeEnabled: boolean
  showImportExport: boolean
  setShowImportExport: Dispatch<SetStateAction<boolean>>
  pipelines: TransformationPipeline[]
  onImportPipelines: (pipelines: TransformationPipeline[]) => void
  showShortcuts: boolean
  setShowShortcuts: Dispatch<SetStateAction<boolean>>
  showRename: boolean
  setShowRename: Dispatch<SetStateAction<boolean>>
  documentName: string
  onRenameConfirm: (newName: string) => void
  showNewDialog: boolean
  setShowNewDialog: Dispatch<SetStateAction<boolean>>
  onNewConfirm: () => void
  showSplash: boolean
  setShowSplash: Dispatch<SetStateAction<boolean>>
  showResetConfirm: boolean
  setShowResetConfirm: Dispatch<SetStateAction<boolean>>
  onConfirmReset: () => void
}

/**
 * Renders dialog overlays used by the main Poe editor.
 * @param props - Component props.
 * @returns Dialog overlay elements.
 */
export function PoeEditorDialogs({
  showAbout,
  setShowAbout,
  showTransformer,
  setShowTransformer,
  editingPipeline,
  setEditingPipeline,
  selectedText,
  setSelectedText,
  onSavePipeline,
  onApplyPipeline,
  vimModeEnabled,
  showImportExport,
  setShowImportExport,
  pipelines,
  onImportPipelines,
  showShortcuts,
  setShowShortcuts,
  showRename,
  setShowRename,
  documentName,
  onRenameConfirm,
  showNewDialog,
  setShowNewDialog,
  onNewConfirm,
  showSplash,
  setShowSplash,
  showResetConfirm,
  setShowResetConfirm,
  onConfirmReset,
}: PoeEditorDialogsProps): ReactElement {
  return (
    <>
      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />

      <TransformerDialog
        open={showTransformer}
        onOpenChange={(open) => {
          setShowTransformer(open)
          if (!open) {
            setEditingPipeline(null)
            setSelectedText(undefined)
          }
        }}
        onSave={onSavePipeline}
        onApply={onApplyPipeline}
        editPipeline={editingPipeline}
        initialPreviewText={selectedText}
        vimMode={vimModeEnabled}
      />

      <TransformerImportExportDialog
        key={`import-export-${showImportExport}`}
        open={showImportExport}
        onOpenChange={setShowImportExport}
        pipelines={pipelines}
        onImport={onImportPipelines}
      />

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        vimModeEnabled={vimModeEnabled}
      />

      <RenameDialog
        key={`rename-${showRename}`}
        open={showRename}
        onOpenChange={setShowRename}
        currentName={documentName}
        onRename={onRenameConfirm}
      />

      <NewDocumentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onConfirm={onNewConfirm}
      />

      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} isLoading={false} debug={true} />
      ) : null}

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset App State?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current work and return to the default state. This action cannot
              be undone.
              <br />
              <br />
              <span className="font-medium text-foreground">
                Note: Your saved transformers will remain intact.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowResetConfirm(false)
                onConfirmReset()
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
