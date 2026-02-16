import { useState, useCallback, useMemo, useEffect, useRef, type ReactElement } from 'react'
import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useUrlState } from '@/hooks/useUrlState'
import { useViewMode } from '@/hooks/useViewMode'
import { useVimMode } from '@/hooks/useVimMode'
import { useWordCount } from '@/hooks/useWordCount'
import { useLineNumbers } from '@/hooks/useLineNumbers'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSyncScroll } from '@/hooks/useSyncScroll'
import { useTransformers } from '@/hooks/useTransformers'
import { useEditorPreferences } from '@/hooks/useEditorPreferences'
import { renderMarkdown } from '@/utils/markdown'
import { downloadFile } from '@/utils/download'
import { applyPipeline } from '@/utils/transformer-engine'
import { EditorPane, type EditorPaneHandle, type TableAction } from '@/components/editor'
import { PreviewPane } from '@/components/PreviewPane'
import { SplashScreen } from '@/components/SplashScreen'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { cn } from '@/utils/classnames'
import { AboutDialog } from '@/components/AboutDialog'
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
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { EditorToolbar } from '@/components/EditorToolbar'
import { RenameDialog } from '@/components/RenameDialog'
import { NewDocumentDialog } from '@/components/NewDocumentDialog'
import { TransformerDialog } from '@/components/transformer/TransformerDialog'
import { TransformerImportExportDialog } from '@/components/transformer/TransformerImportExportDialog'
import type { TransformationPipeline } from '@/components/transformer/types'
import { useToast } from '@/hooks/useToast'
import { generateShareableUrl } from '@/utils/urlShare'

import {
  formatBold,
  formatItalic,
  formatLink,
  formatCode,
  formatCodeBlock,
  formatHeading,
  formatQuote,
  formatBulletList,
  formatNumberedList,
} from '@/utils/formatting'

const DEFAULT_CONTENT = `# Poe Markdown Editor

An online, no-signup, writing tool with Vim support.

## Features

- Live preview with split-pane layout
- Vim mode
- Dark and light theme support
- Export to Markdown or HTML
- URL-based document persistence
- Custom text transformers
- Transformers import/export
- Markdown table tools

\`\`\`javascript
const editor = "Poe";
console.log(\`Welcome to \${editor}\`);
\`\`\`

> Start writing
`

interface PoeEditorProps {
  /** Callback fired when the editor is fully mounted and ready */
  onReady?: () => void
}

/**
 * Main editor component with markdown editing, preview, and toolbar functionality.
 * @param props - Component props
 * @returns The PoeEditor component
 */
export function PoeEditor({ onReady }: PoeEditorProps): ReactElement {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showTransformer, setShowTransformer] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<TransformationPipeline | null>(null)
  const [selectedText, setSelectedText] = useState<string | undefined>(undefined)
  const [, setCursorPosition] = useState({
    lineNumber: 1,
    column: 1,
  })
  const [isInTable, setIsInTable] = useState(false)
  const documentMenuRef = useRef<HTMLButtonElement>(null)

  /* View mode management */
  const { viewMode, setViewMode } = useViewMode()

  // For mobile, we map 'split' (default) to 'editor' if it happens to be set
  const activeTab = viewMode === 'split' ? 'editor' : viewMode

  const isMobile = useIsMobile()

  // Stable error handler to prevent useUrlState effect from re-running
  const handleError = useCallback(
    (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
    [toast]
  )

  const handleLengthWarning = useCallback(
    (length: number, limit: number) => {
      const percentage = Math.round((length / limit) * 100)
      toast({
        variant: 'default',
        description: `URL limit reached, used ${percentage}%. Changes are not saved.`,
      })
    },
    [toast]
  )

  // Editor preferences
  const { startEmpty, toggleStartEmpty } = useEditorPreferences()

  // URL state management
  const { content, setContent, documentName, setDocumentName, isOverLimit } = useUrlState({
    defaultContent: startEmpty ? '' : DEFAULT_CONTENT,
    defaultName: 'untitled.md',
    onError: handleError,
    onLengthWarning: handleLengthWarning,
  })

  // Vim mode management
  const { vimMode: vimModeEnabled, toggleVimMode } = useVimMode()

  // Word count management
  const { showWordCount, toggleWordCount } = useWordCount()

  // Line numbers management
  const { showLineNumbers, toggleLineNumbers } = useLineNumbers()

  // Transformers management
  const { pipelines, addPipeline, updatePipeline, removePipeline, replacePipelines } =
    useTransformers()

  // Scroll synchronization
  const { sourceRef, targetRef } = useSyncScroll<EditorPaneHandle, HTMLDivElement>({
    enabled: !isMobile,
  })

  // Rendered HTML for preview
  const htmlContent = useMemo(() => renderMarkdown(content), [content])

  // Formatting functions
  const handleFormatBold = useCallback((): void => {
    formatBold(sourceRef.current)
  }, [sourceRef])

  const handleFormatItalic = useCallback((): void => {
    formatItalic(sourceRef.current)
  }, [sourceRef])

  const handleFormatLink = useCallback((): void => {
    formatLink(sourceRef.current)
  }, [sourceRef])

  const handleFormatCode = useCallback((): void => {
    formatCode(sourceRef.current)
  }, [sourceRef])

  const handleFormatCodeBlock = useCallback((): void => {
    formatCodeBlock(sourceRef.current)
  }, [sourceRef])

  const handleFormatHeading = useCallback(
    (level: number): void => {
      formatHeading(sourceRef.current, level)
    },
    [sourceRef]
  )

  const handleFormatQuote = useCallback((): void => {
    formatQuote(sourceRef.current)
  }, [sourceRef])

  const handleFormatBulletList = useCallback((): void => {
    formatBulletList(sourceRef.current)
  }, [sourceRef])

  const handleFormatNumberedList = useCallback((): void => {
    formatNumberedList(sourceRef.current)
  }, [sourceRef])

  // Deprecated usage from keyboard shortcut, can map to format-table
  const handleFormatTable = useCallback((): void => {
    sourceRef.current?.performTableAction('format-table')
  }, [sourceRef])

  const handleTableAction = useCallback(
    (action: TableAction) => {
      sourceRef.current?.performTableAction(action)
    },
    [sourceRef]
  )

  const handleApplyPipeline = useCallback(
    (pipeline: TransformationPipeline) => {
      const editor = sourceRef.current
      if (!editor) return

      const selection = editor.getSelection()
      if (!selection) {
        toast({ description: 'No text selected' })
        return
      }

      const transformed = applyPipeline(selection, pipeline)
      editor.replaceSelection(transformed)
      toast({ description: `Applied ${pipeline.name}` })
    },
    [toast, sourceRef]
  )

  const handleSavePipeline = useCallback(
    (pipeline: TransformationPipeline) => {
      if (editingPipeline) {
        updatePipeline(pipeline)
        toast({ description: 'Pipeline updated' })
        setEditingPipeline(null)
      } else {
        addPipeline(pipeline)
        toast({ description: 'Pipeline saved' })
      }
    },
    [addPipeline, updatePipeline, editingPipeline, toast]
  )

  const handleEditPipeline = useCallback((pipeline: TransformationPipeline) => {
    setEditingPipeline(pipeline)
    setShowTransformer(true)
  }, [])

  const handleDeletePipeline = useCallback(
    (id: string) => {
      removePipeline(id)
      toast({ description: 'Pipeline deleted' })
    },
    [removePipeline, toast]
  )

  const handleReorderPipelines = useCallback(
    (reordered: TransformationPipeline[]) => {
      replacePipelines(reordered)
    },
    [replacePipelines]
  )

  const handleReset = useCallback((): void => {
    window.history.replaceState(null, '', window.location.pathname)
    window.location.reload()
  }, [])

  // Document management functions
  const handleNew = useCallback((): void => {
    setShowNewDialog(true)
  }, [])

  const handleNewConfirm = useCallback((): void => {
    setContent('')
    setDocumentName('untitled.md')
    toast({ description: 'New document created' })
  }, [setContent, setDocumentName, toast])

  const handleRename = useCallback((): void => {
    setShowRename(true)
  }, [])

  const handleRenameConfirm = useCallback(
    (newName: string): void => {
      if (newName && newName.trim()) {
        setDocumentName(newName.trim())
        toast({ description: `Renamed to ${newName.trim()}` })
      }
    },
    [setDocumentName, toast]
  )

  const handleDownloadMarkdown = useCallback((): void => {
    downloadFile(documentName, content, 'text/markdown')
    toast({ description: 'Downloaded as Markdown' })
  }, [documentName, content, toast])

  const handleDownloadHTML = useCallback((): void => {
    const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
  <style>
    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
    @media (max-width: 767px) { .markdown-body { padding: 15px; } }
  </style>
</head>
<body class="markdown-body">
${htmlContent}
</body>
</html>`
    const htmlFileName = documentName.replace(/\.md$/, '.html')
    downloadFile(htmlFileName, htmlDoc, 'text/html')
    toast({ description: 'Downloaded as HTML' })
  }, [documentName, htmlContent, toast])

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      // Generate shareable URL with metadata in path
      const shareableUrl = generateShareableUrl(
        content,
        documentName,
        window.location.hash.slice(1)
      )
      await navigator.clipboard.writeText(shareableUrl)
      toast({
        description: 'Link copied to clipboard!',
      })
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to copy link',
      })
    }
  }, [toast, content, documentName])

  const handleClear = useCallback((): void => {
    setContent('')
    toast({ description: 'Content cleared' })
  }, [setContent, toast])

  const handleSave = useCallback((): void => {
    // Save is automatic via URL state, just show confirmation
    toast({ description: 'Document saved to URL' })
  }, [toast])

  // Layout toggles for desktop
  const handleToggleEditor = useCallback(() => {
    setViewMode(viewMode === 'split' ? 'editor' : 'split')
  }, [viewMode, setViewMode])

  const handleTogglePreview = useCallback(() => {
    setViewMode(viewMode === 'split' ? 'preview' : 'split')
  }, [viewMode, setViewMode])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onBold: handleFormatBold,
    onItalic: handleFormatItalic,
    onLink: handleFormatLink,
    onCode: handleFormatCode,
    onCodeBlock: handleFormatCodeBlock,
    onSave: handleSave,
    onHelp: () => setShowShortcuts(true),
    onNew: handleNew,
    onRename: handleRename,
    onClear: handleClear,
    onCopyLink: handleCopyLink,
    onReset: () => setShowResetConfirm(true),
    onHeading: handleFormatHeading,
    onQuote: handleFormatQuote,
    onBulletList: handleFormatBulletList,
    onNumberedList: handleFormatNumberedList,
    onTable: handleFormatTable,
    onTransform: () => {
      const selection = sourceRef.current?.getSelection()
      setSelectedText(selection || undefined)
      setShowTransformer(true)
    },
    onDownload: handleDownloadMarkdown,
    onFocusEditor: () => sourceRef.current?.focus(),
    onFocusDocument: () => documentMenuRef.current?.focus(),
  })

  // Effects
  useEffect(() => {
    // Defer setState to avoid cascading renders while still tracking mount state
    const timeoutId = setTimeout(() => {
      setMounted(true)
    }, 0)

    // Notify parent that the editor is ready
    // Use requestAnimationFrame to ensure DOM is painted
    requestAnimationFrame(() => {
      onReady?.()
    })

    return () => clearTimeout(timeoutId)
  }, [onReady, setMounted])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowAbout(false)
        setShowShortcuts(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleFormat = (type: 'bold' | 'italic' | 'link' | 'code'): void => {
    switch (type) {
      case 'bold':
        handleFormatBold()
        break
      case 'italic':
        handleFormatItalic()
        break
      case 'link':
        handleFormatLink()
        break
      case 'code':
        handleFormatCode()
        break
    }
  }

  return (
    <TooltipProvider>
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
        onSave={handleSavePipeline}
        onApply={handleApplyPipeline}
        editPipeline={editingPipeline}
        initialPreviewText={selectedText}
        vimMode={vimModeEnabled}
      />

      <TransformerImportExportDialog
        key={`import-export-${showImportExport}`}
        open={showImportExport}
        onOpenChange={setShowImportExport}
        pipelines={pipelines}
        onImport={replacePipelines}
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
        onRename={handleRenameConfirm}
      />

      <NewDocumentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onConfirm={handleNewConfirm}
      />

      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} isLoading={false} debug={true} />
      )}

      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <EditorToolbar
          documentName={documentName}
          isOverLimit={isOverLimit}
          vimModeEnabled={vimModeEnabled}
          theme={theme}
          mounted={mounted}
          onNew={handleNew}
          onRename={handleRename}
          onDownloadMarkdown={handleDownloadMarkdown}
          onDownloadHTML={handleDownloadHTML}
          onCopyLink={handleCopyLink}
          onClear={handleClear}
          onFormatBold={handleFormatBold}
          onFormatItalic={handleFormatItalic}
          onFormatLink={handleFormatLink}
          onFormatCode={handleFormatCode}
          onFormatHeading={handleFormatHeading}
          onFormatQuote={handleFormatQuote}
          onFormatBulletList={handleFormatBulletList}
          onFormatNumberedList={handleFormatNumberedList}
          onFormatCodeBlock={handleFormatCodeBlock}
          onTableAction={handleTableAction}
          isInTable={isInTable}
          toggleVimMode={toggleVimMode}
          toggleTheme={toggleTheme}
          setShowShortcuts={setShowShortcuts}
          setShowAbout={setShowAbout}
          setShowSplash={setShowSplash}
          pipelines={pipelines}
          onOpenTransformer={() => {
            const selection = sourceRef.current?.getSelection()
            setSelectedText(selection || undefined)
            setShowTransformer(true)
          }}
          onApplyPipeline={handleApplyPipeline}
          onOpenImportExport={() => setShowImportExport(true)}
          onEditPipeline={handleEditPipeline}
          onDeletePipeline={handleDeletePipeline}
          onReorderPipelines={handleReorderPipelines}
          onReset={() => setShowResetConfirm(true)}
          showWordCount={showWordCount}
          toggleWordCount={toggleWordCount}
          showLineNumbers={showLineNumbers}
          toggleLineNumbers={toggleLineNumbers}
          startEmpty={startEmpty}
          toggleStartEmpty={toggleStartEmpty}
          documentMenuRef={documentMenuRef}
        />

        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset App State?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear your current work and return to the default state. This action
                cannot be undone.
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
                  handleReset()
                }}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <main className="flex-1 overflow-hidden">
          {!isMobile ? (
            <div className="h-full p-4">
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                {(viewMode === 'split' || viewMode === 'editor') && (
                  <>
                    <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={30}>
                      <div className={cn('h-full', viewMode === 'split' && 'pr-2')}>
                        <EditorPane
                          ref={sourceRef}
                          value={content}
                          onChange={setContent}
                          onCursorChange={(p) => {
                            setCursorPosition(p)
                            setIsInTable(p.isInTable ?? false)
                          }}
                          theme={mounted && theme === 'dark' ? 'dark' : 'light'}
                          onFormat={handleFormat}
                          onCodeBlock={handleFormatCodeBlock}
                          vimMode={vimModeEnabled}
                          showWordCount={showWordCount}
                          showLineNumbers={showLineNumbers}
                          viewMode={viewMode}
                          onToggleLayout={handleToggleEditor}
                        />
                      </div>
                    </ResizablePanel>
                    {viewMode === 'split' && <ResizableHandle withHandle className="mx-2" />}
                  </>
                )}

                {(viewMode === 'split' || viewMode === 'preview') && (
                  <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={30}>
                    <div className={cn('h-full', viewMode === 'split' && 'pl-2')}>
                      <PreviewPane
                        ref={targetRef}
                        htmlContent={htmlContent}
                        viewMode={viewMode}
                        onToggleLayout={handleTogglePreview}
                      />
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="w-full border-b border-border/60 bg-background h-10 flex">
                <button
                  onClick={() => setViewMode('editor')}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center text-sm font-medium transition-colors border-b-2',
                    activeTab === 'editor'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center text-sm font-medium transition-colors border-b-2',
                    activeTab === 'preview'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Preview
                </button>
              </div>

              {/* Editor Pane - Always mounted, hidden when not active */}
              <div className={cn('flex-1 p-4 mt-0', activeTab !== 'editor' && 'hidden')}>
                <EditorPane
                  ref={sourceRef}
                  value={content}
                  onChange={setContent}
                  onCursorChange={(p) => {
                    setCursorPosition(p)
                    setIsInTable(p.isInTable ?? false)
                  }}
                  theme={mounted && theme === 'dark' ? 'dark' : 'light'}
                  onFormat={handleFormat}
                  onCodeBlock={handleFormatCodeBlock}
                  vimMode={vimModeEnabled}
                  showWordCount={showWordCount}
                  showLineNumbers={showLineNumbers}
                  viewMode={activeTab === 'editor' ? 'editor' : 'preview'}
                />
              </div>

              {/* Preview Pane - Always mounted, hidden when not active */}
              <div
                className={cn('flex-1 p-4 mt-0 overflow-auto', activeTab !== 'preview' && 'hidden')}
              >
                <PreviewPane ref={targetRef} htmlContent={htmlContent} />
              </div>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
