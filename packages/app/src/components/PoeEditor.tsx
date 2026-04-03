import { useState, useCallback, useMemo, useEffect, useRef, type ReactElement } from 'react'
import { useTheme } from 'next-themes'
import { useDisplayLineMotion } from '@/hooks/useDisplayLineMotion'
import { useEditorPreferences } from '@/hooks/useEditorPreferences'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLineNumbers } from '@/hooks/useLineNumbers'
import { useSpellCheck } from '@/hooks/useSpellCheck'
import { useSyncScroll } from '@/hooks/useSyncScroll'
import { useToast } from '@/hooks/useToast'
import { useTransformers } from '@/hooks/useTransformers'
import { useUrlState } from '@/hooks/useUrlState'
import { useViewMode } from '@/hooks/useViewMode'
import { useVimMode } from '@/hooks/useVimMode'
import { useWordCount } from '@/hooks/useWordCount'
import { type EditorPaneHandle } from '@/components/editor'
import { PoeEditorDialogs } from '@/components/poe-editor/PoeEditorDialogs'
import { PoeEditorWorkspace } from '@/components/poe-editor/PoeEditorWorkspace'
import { DEFAULT_CONTENT } from '@/components/poe-editor/constants'
import { useFormattingHandlers } from '@/components/poe-editor/useFormattingHandlers'
import { usePoeEditorKeyboardShortcuts } from '@/components/poe-editor/usePoeEditorKeyboardShortcuts'
import { useUrlStateNotifications } from '@/components/poe-editor/useUrlStateNotifications'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toggleTaskListItem } from '@/utils/formatting'
import { buildHtmlExportDocument } from '@/utils/htmlExport'
import { renderMarkdown, renderMarkdownForPreview, getTocHeadings } from '@/utils/markdown'
import type { MermaidColorMode } from '@/utils/mermaidTheme'
import { applyPipelineWithIssues, getPipelineIssueSummary } from '@/utils/transformer-engine'
import { downloadFile } from '@/utils/download'
import { generateShareableUrl } from '@/utils/urlShare'
import type { TransformationPipeline } from '@/components/transformer/types'

interface PoeEditorProps {
  /** Callback fired when the editor is fully mounted and ready. */
  onReady?: () => void
}

/**
 * Main editor component with markdown editing, preview, and toolbar functionality.
 * @param props - Component props.
 * @returns The PoeEditor component.
 */
export function PoeEditor({ onReady }: PoeEditorProps): ReactElement {
  const { theme, resolvedTheme, setTheme } = useTheme()
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

  const { viewMode, setViewMode } = useViewMode()
  const activeTab = viewMode === 'split' ? 'editor' : viewMode
  const isMobile = useIsMobile()
  const { handleError, handleLengthWarning } = useUrlStateNotifications({ toast })

  const {
    startEmpty,
    toggleStartEmpty,
    showTocPanel,
    toggleShowTocPanel,
    showEmojiPicker,
    toggleShowEmojiPicker,
  } = useEditorPreferences()

  const { content, setContent, documentName, setDocumentName, isOverLimit } = useUrlState({
    defaultContent: startEmpty ? '' : DEFAULT_CONTENT,
    defaultName: 'untitled.md',
    onError: handleError,
    onLengthWarning: handleLengthWarning,
  })

  const { vimMode: vimModeEnabled, toggleVimMode } = useVimMode()
  const { displayLineMotion, toggleDisplayLineMotion } = useDisplayLineMotion()
  const { showWordCount, toggleWordCount } = useWordCount()
  const { showLineNumbers, toggleLineNumbers } = useLineNumbers()

  const { pipelines, addPipeline, updatePipeline, removePipeline, replacePipelines } =
    useTransformers()

  const { spellCheck, setSpellCheck, toggleSpellCheck } = useSpellCheck()

  const { sourceRef, targetRef } = useSyncScroll<EditorPaneHandle, HTMLDivElement>({
    enabled: !isMobile,
  })
  const {
    handleFormatBold,
    handleFormatItalic,
    handleFormatLink,
    handleFormatCode,
    handleFormatCodeBlock,
    handleFormatHeading,
    handleFormatQuote,
    handleFormatBulletList,
    handleFormatNumberedList,
    handleFormatTaskList,
    handleFormatTable,
    handleFormatAllTables,
    handleTableAction,
    handleFormat,
  } = useFormattingHandlers({
    sourceRef,
  })

  const tocHeadings = useMemo(() => getTocHeadings(content), [content])
  const [htmlContent, setHtmlContent] = useState(() => renderMarkdown(content))
  const colorMode: MermaidColorMode = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'
  const editorTheme: 'light' | 'dark' = mounted && theme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    let isCancelled = false

    void renderMarkdownForPreview(content)
      .then((nextHtml) => {
        if (isCancelled) return
        setHtmlContent(nextHtml)
      })
      .catch(() => {
        if (isCancelled) return
        setHtmlContent(renderMarkdown(content))
      })

    return () => {
      isCancelled = true
    }
  }, [content])

  const handleOpenTransformer = useCallback((): void => {
    const selection = sourceRef.current?.getSelection()
    setSelectedText(selection || undefined)
    setShowTransformer(true)
  }, [sourceRef])

  const handleApplyPipeline = useCallback(
    (pipeline: TransformationPipeline): void => {
      const editor = sourceRef.current
      if (!editor) return

      const selection = editor.getSelection()
      if (!selection) {
        toast({ description: 'No text selected' })
        return
      }

      const result = applyPipelineWithIssues(selection, pipeline)
      editor.replaceSelection(result.output)

      const issueSummary = getPipelineIssueSummary(result.issues)
      if (issueSummary) {
        toast({
          description: `Could not fully apply ${pipeline.name}: ${issueSummary}`,
          variant: 'destructive',
        })
        return
      }

      toast({ description: `Applied ${pipeline.name}` })
    },
    [sourceRef, toast]
  )

  const handleSavePipeline = useCallback(
    (pipeline: TransformationPipeline): void => {
      if (editingPipeline) {
        updatePipeline(pipeline)
        toast({ description: 'Pipeline updated' })
        setEditingPipeline(null)
        return
      }

      addPipeline(pipeline)
      toast({ description: 'Pipeline saved' })
    },
    [addPipeline, editingPipeline, toast, updatePipeline]
  )

  const handleEditPipeline = useCallback(
    (pipeline: TransformationPipeline): void => {
      const selection = sourceRef.current?.getSelection()
      setSelectedText(selection || undefined)
      setEditingPipeline(pipeline)
      setShowTransformer(true)
    },
    [sourceRef]
  )

  const handleDeletePipeline = useCallback(
    (id: string): void => {
      removePipeline(id)
      toast({ description: 'Pipeline deleted' })
    },
    [removePipeline, toast]
  )

  const handleReorderPipelines = useCallback(
    (reordered: TransformationPipeline[]): void => {
      replacePipelines(reordered)
    },
    [replacePipelines]
  )

  const handleReset = useCallback((): void => {
    window.history.replaceState(null, '', window.location.pathname)
    window.location.reload()
  }, [])

  const handleNewConfirm = useCallback((): void => {
    setContent('')
    setDocumentName('untitled.md')
    toast({ description: 'New document created' })
  }, [setContent, setDocumentName, toast])

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
  }, [content, documentName, toast])

  const handleDownloadHTML = useCallback((): void => {
    const htmlDoc = buildHtmlExportDocument({
      documentName,
      htmlContent,
      colorMode,
    })
    const htmlFileName = documentName.replace(/\.md$/, '.html')
    downloadFile(htmlFileName, htmlDoc, 'text/html')
    toast({ description: 'Downloaded as HTML' })
  }, [colorMode, documentName, htmlContent, toast])

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      const shareableUrl = generateShareableUrl(
        content,
        documentName,
        window.location.hash.slice(1)
      )
      await navigator.clipboard.writeText(shareableUrl)
      toast({ description: 'Link copied to clipboard!' })
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to copy link',
      })
    }
  }, [content, documentName, toast])

  const handleClear = useCallback((): void => {
    setContent('')
    toast({ description: 'Content cleared' })
  }, [setContent, toast])

  const handleTaskListToggle = useCallback(
    (taskIndex: number, checked: boolean): void => {
      const updatedContent = toggleTaskListItem(content, taskIndex, checked)
      if (updatedContent !== content) {
        setContent(updatedContent)
      }
    },
    [content, setContent]
  )

  const handleSave = useCallback((): void => {
    toast({ description: 'Document saved to URL' })
  }, [toast])

  const handleToggleEditor = useCallback((): void => {
    setViewMode(viewMode === 'split' ? 'editor' : 'split')
  }, [setViewMode, viewMode])

  const handleTogglePreview = useCallback((): void => {
    setViewMode(viewMode === 'split' ? 'preview' : 'split')
  }, [setViewMode, viewMode])

  const handleCursorChange = useCallback(
    (position: { lineNumber: number; column: number; isInTable: boolean }): void => {
      setCursorPosition(position)
      setIsInTable(position.isInTable ?? false)
    },
    []
  )

  const toggleTheme = useCallback((): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  usePoeEditorKeyboardShortcuts({
    handleFormatBold,
    handleFormatItalic,
    handleFormatLink,
    handleFormatCode,
    handleFormatCodeBlock,
    handleSave,
    setShowShortcuts,
    handleNew: () => setShowNewDialog(true),
    handleRename: () => setShowRename(true),
    handleClear,
    handleCopyLink,
    requestReset: () => setShowResetConfirm(true),
    handleFormatHeading,
    handleFormatQuote,
    handleFormatBulletList,
    handleFormatNumberedList,
    handleFormatTable,
    handleOpenTransformer,
    handleDownloadMarkdown,
    sourceRef,
    documentMenuRef,
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMounted(true)
    }, 0)

    requestAnimationFrame(() => {
      onReady?.()
    })

    return () => clearTimeout(timeoutId)
  }, [onReady, setMounted])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setShowAbout(false)
        setShowShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const editorToolbarProps = {
    documentName,
    isOverLimit,
    vimModeEnabled,
    theme,
    mounted,
    onNew: () => setShowNewDialog(true),
    onRename: () => setShowRename(true),
    onDownloadMarkdown: handleDownloadMarkdown,
    onDownloadHTML: handleDownloadHTML,
    onCopyLink: handleCopyLink,
    onClear: handleClear,
    onFormatBold: handleFormatBold,
    onFormatItalic: handleFormatItalic,
    onFormatLink: handleFormatLink,
    onFormatCode: handleFormatCode,
    onFormatHeading: handleFormatHeading,
    onFormatQuote: handleFormatQuote,
    onFormatBulletList: handleFormatBulletList,
    onFormatNumberedList: handleFormatNumberedList,
    onFormatTaskList: handleFormatTaskList,
    onFormatCodeBlock: handleFormatCodeBlock,
    onTableAction: handleTableAction,
    onFormatAllTables: handleFormatAllTables,
    isInTable,
    toggleVimMode,
    toggleTheme,
    setShowShortcuts,
    setShowAbout,
    setShowSplash,
    pipelines,
    onOpenTransformer: handleOpenTransformer,
    onApplyPipeline: handleApplyPipeline,
    onOpenImportExport: () => setShowImportExport(true),
    onEditPipeline: handleEditPipeline,
    onDeletePipeline: handleDeletePipeline,
    onReorderPipelines: handleReorderPipelines,
    onReset: () => setShowResetConfirm(true),
    showWordCount,
    toggleWordCount,
    showLineNumbers,
    toggleLineNumbers,
    startEmpty,
    toggleStartEmpty,
    showTocPanel,
    toggleShowTocPanel,
    showEmojiPicker,
    toggleShowEmojiPicker,
    documentMenuRef,
    spellCheck,
    toggleSpellCheck,
    displayLineMotion,
    toggleDisplayLineMotion,
  }

  return (
    <TooltipProvider>
      <PoeEditorDialogs
        showAbout={showAbout}
        setShowAbout={setShowAbout}
        showTransformer={showTransformer}
        setShowTransformer={setShowTransformer}
        editingPipeline={editingPipeline}
        setEditingPipeline={setEditingPipeline}
        selectedText={selectedText}
        setSelectedText={setSelectedText}
        onSavePipeline={handleSavePipeline}
        onApplyPipeline={handleApplyPipeline}
        vimModeEnabled={vimModeEnabled}
        showImportExport={showImportExport}
        setShowImportExport={setShowImportExport}
        pipelines={pipelines}
        onImportPipelines={replacePipelines}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        showRename={showRename}
        setShowRename={setShowRename}
        documentName={documentName}
        onRenameConfirm={handleRenameConfirm}
        showNewDialog={showNewDialog}
        setShowNewDialog={setShowNewDialog}
        onNewConfirm={handleNewConfirm}
        showSplash={showSplash}
        setShowSplash={setShowSplash}
        showResetConfirm={showResetConfirm}
        setShowResetConfirm={setShowResetConfirm}
        onConfirmReset={handleReset}
      />

      <PoeEditorWorkspace
        editorToolbarProps={editorToolbarProps}
        isMobile={isMobile}
        viewMode={viewMode}
        activeTab={activeTab}
        setViewMode={setViewMode}
        sourceRef={sourceRef}
        targetRef={targetRef}
        content={content}
        setContent={setContent}
        onCursorChange={handleCursorChange}
        editorTheme={editorTheme}
        onFormat={handleFormat}
        onCodeBlock={handleFormatCodeBlock}
        vimModeEnabled={vimModeEnabled}
        displayLineMotion={displayLineMotion}
        showWordCount={showWordCount}
        showLineNumbers={showLineNumbers}
        onToggleEditorLayout={handleToggleEditor}
        onTogglePreviewLayout={handleTogglePreview}
        spellCheck={spellCheck}
        onSpellCheckChange={setSpellCheck}
        showEmojiPicker={showEmojiPicker}
        htmlContent={htmlContent}
        onTaskListToggle={handleTaskListToggle}
        colorMode={colorMode}
        tocHeadings={tocHeadings}
        showTocPanel={showTocPanel}
      />
    </TooltipProvider>
  )
}
