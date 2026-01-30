import * as React from 'react'
import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/useMobile'
import { useUrlState } from '@/hooks/useUrlState'
import { useVimMode } from '@/hooks/useVimMode'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSyncScroll } from '@/hooks/useSyncScroll'
import { renderMarkdown } from '@/utils/markdown'
import { downloadFile } from '@/utils/download'
import { EditorPane, type EditorPaneHandle } from '@/components/EditorPane'
import { PreviewPane } from '@/components/PreviewPane'
import { SplashScreen } from '@/components/SplashScreen'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AboutDialog } from '@/components/AboutDialog'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { EditorToolbar } from '@/components/EditorToolbar'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/classnames'
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
import type { ReactElement } from 'react'



const DEFAULT_CONTENT = `# Welcome to Poe

A Markdown editor with vim support.

## Features

- Live preview with split pane
- Vim mode for power users
- Dark and light themes
- Export to MD or HTML

\`\`\`javascript
const editor = "Poe";
console.log(\`Welcome to \${editor}\`);
\`\`\`

> Start writing.
`

interface PoeEditorProps {
  onReady?: () => void
}

export function PoeEditor({ onReady }: PoeEditorProps): ReactElement {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)
  const [showAbout, setShowAbout] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)
  const [showSplash, setShowSplash] = React.useState(false)
  const [, setCursorPosition] = React.useState({
    lineNumber: 1,
    column: 1,
  })

  const isMobile = useIsMobile()
  const editorRef = React.useRef<EditorPaneHandle>(null)

  // Stable error handler to prevent useUrlState effect from re-running
  const handleError = React.useCallback(
    (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
    [toast]
  )

  const handleLengthWarning = React.useCallback(
    (length: number, limit: number) => {
      const percentage = Math.round((length / limit) * 100)
      toast({
        variant: 'default',
        description: `URL limit reached, used ${percentage}%. Changes are not saved.`,
      })
    },
    [toast]
  )

  // URL state management
  const { content, setContent, documentName, setDocumentName, isOverLimit } = useUrlState({
    defaultContent: DEFAULT_CONTENT,
    defaultName: 'untitled.md',
    onError: handleError,
    onLengthWarning: handleLengthWarning,
  })

  // Vim mode management
  const { vimMode: vimModeEnabled, toggleVimMode } = useVimMode()

  // Scroll synchronization
  useSyncScroll({
    enabled: !isMobile,
  })

  // Rendered HTML for preview
  const htmlContent = React.useMemo(() => renderMarkdown(content), [content])

  // Formatting functions
  const handleFormatBold = React.useCallback((): void => {
    formatBold(editorRef.current)
  }, [])

  const handleFormatItalic = React.useCallback((): void => {
    formatItalic(editorRef.current)
  }, [])

  const handleFormatLink = React.useCallback((): void => {
    formatLink(editorRef.current)
  }, [])

  const handleFormatCode = React.useCallback((): void => {
    formatCode(editorRef.current)
  }, [])

  const handleFormatCodeBlock = React.useCallback((): void => {
    formatCodeBlock(editorRef.current)
  }, [])

  const handleFormatHeading = React.useCallback(
    (level: number): void => {
      formatHeading(editorRef.current, level)
    },
    []
  )

  const handleFormatQuote = React.useCallback((): void => {
    formatQuote(editorRef.current)
  }, [])

  const handleFormatBulletList = React.useCallback((): void => {
    formatBulletList(editorRef.current)
  }, [])

  const handleFormatNumberedList = React.useCallback((): void => {
    formatNumberedList(editorRef.current)
  }, [])

  // Document management functions
  const handleNew = React.useCallback((): void => {
    if (confirm('Create a new document? Current content will be lost if not saved.')) {
      setContent('')
      setDocumentName('untitled.md')
      toast({ description: 'New document created' })
    }
  }, [setContent, setDocumentName, toast])

  const handleRename = React.useCallback((): void => {
    const newName = prompt('Enter new document name:', documentName)
    if (newName && newName.trim()) {
      setDocumentName(newName.trim())
      toast({ description: `Renamed to ${newName}` })
    }
  }, [documentName, setDocumentName, toast])

  const handleDownloadMarkdown = React.useCallback((): void => {
    downloadFile(documentName, content, 'text/markdown')
    toast({ description: 'Downloaded as Markdown' })
  }, [documentName, content, toast])

  const handleDownloadHTML = React.useCallback((): void => {
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

  const handleCopyLink = React.useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        description: 'Link copied to clipboard!',
      })
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to copy link',
      })
    }
  }, [toast])

  const handleClear = React.useCallback((): void => {
    if (confirm('Clear all content? This cannot be undone.')) {
      setContent('')
      toast({ description: 'Content cleared' })
    }
  }, [setContent, toast])

  const handleSave = React.useCallback((): void => {
    // Save is automatic via URL state, just show confirmation
    toast({ description: 'Document auto-saved to URL!' })
  }, [toast])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onBold: handleFormatBold,
    onItalic: handleFormatItalic,
    onLink: handleFormatLink,
    onCode: handleFormatCode,
    onCodeBlock: handleFormatCodeBlock,
    onSave: handleSave,
    onHelp: () => setShowShortcuts(true),
  })

  // Effects
  React.useEffect(() => {
    setMounted(true)

    // Notify parent that the editor is ready
    // Use requestAnimationFrame to ensure DOM is painted
    requestAnimationFrame(() => {
      onReady?.()
    })
  }, [onReady])

  React.useEffect(() => {
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

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        vimModeEnabled={vimModeEnabled}
      />

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isLoading={false} debug={true} />}

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
          toggleVimMode={toggleVimMode}
          toggleTheme={toggleTheme}
          setShowShortcuts={setShowShortcuts}
          setShowAbout={setShowAbout}
          setShowSplash={setShowSplash}
        />

        <main className="flex-1 overflow-hidden">
          {!isMobile ? (
            <div className="h-full p-4">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full pr-2">
                    <EditorPane
                      ref={editorRef}
                      value={content}
                      onChange={setContent}
                      onCursorChange={setCursorPosition}
                      theme={mounted && theme === 'dark' ? 'dark' : 'light'}
                      onFormat={handleFormat}
                      onCodeBlock={handleFormatCodeBlock}
                      vimMode={vimModeEnabled}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="mx-2" />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full pl-2">
                    <PreviewPane htmlContent={htmlContent} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                <TabsList className="w-full rounded-none border-b border-border/60 bg-background h-10">
                  <TabsTrigger value="editor" className="flex-1">
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="editor" className="flex-1 p-4 mt-0">
                  <EditorPane
                    ref={editorRef}
                    value={content}
                    onChange={setContent}
                    onCursorChange={setCursorPosition}
                    theme={mounted && theme === 'dark' ? 'dark' : 'light'}
                    onFormat={handleFormat}
                    onCodeBlock={handleFormatCodeBlock}
                    vimMode={vimModeEnabled}
                  />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 p-4 mt-0">
                  <PreviewPane htmlContent={htmlContent} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
