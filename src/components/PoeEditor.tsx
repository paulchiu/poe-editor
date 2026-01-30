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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bold,
  Italic,
  Link,
  Code,
  Heading,
  Quote,
  List,
  Terminal,
  Sun,
  Moon,
  MoreHorizontal,
  FileText,
  FilePlus,
  Pencil,
  Download,
  Link2,
  Trash2,
  Info,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Keyboard,
  CodeSquare,
  ListOrdered,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
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

interface ToolbarButtonProps {
  icon: React.ElementType
  label: string
  onClick?: () => void
  active?: boolean
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: ToolbarButtonProps): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            active && 'bg-accent text-foreground'
          )}
        >
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

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
      {/* About Modal */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">About Poe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">Modal editing for Markdown</p>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Live preview with split-pane layout</li>
                <li>Vim mode</li>
                <li>Dark and light theme support</li>
                <li>Export to Markdown or HTML</li>
                <li>URL-based document persistence</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              <p className="font-semibold mb-1">Version 1.0.0</p>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-6 pr-4">
              <div>
                <h3 className="font-semibold text-sm mb-3">Formatting</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bold</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + B
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Italic</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + I
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Code</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + E
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Link</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + K
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Code Block</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + Shift + K
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Application</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Save</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Cmd/Ctrl + S
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Help</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">?</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Close Modal</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                  </div>
                </div>
              </div>

              {vimModeEnabled && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Vim Mode</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Enter Normal Mode</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Enter Insert Mode</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">i / a</code>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Enter Visual Mode</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">v</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isLoading={false} debug={true} />}

      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <header className={cn(
          "h-14 border-b border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 transition-colors",
           isOverLimit && "border-destructive/50 bg-destructive/10"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "gap-2 text-sm font-medium",
                 isOverLimit && "text-destructive hover:text-destructive hover:bg-destructive/20"
              )}>
                {isOverLimit ? <AlertTriangle className="size-4" /> : <FileText className="size-4" />}
                {documentName}
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleNew}>
                <FilePlus className="size-4" />
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRename}>
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
                  <DropdownMenuItem onClick={handleDownloadMarkdown}>
                    <Download className="size-4" />
                    Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadHTML}>
                    <Download className="size-4" />
                    HTML (.html)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="size-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear}>
                <Trash2 className="size-4" />
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <ToolbarButton icon={Bold} label="Bold (Cmd+B)" onClick={handleFormatBold} />
            <ToolbarButton icon={Italic} label="Italic (Cmd+I)" onClick={handleFormatItalic} />
            <ToolbarButton icon={Link} label="Link (Cmd+K)" onClick={handleFormatLink} />
            <ToolbarButton icon={Code} label="Code (Cmd+E)" onClick={handleFormatCode} />
            <div className="w-px h-5 bg-border mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Heading className="size-4" />
                  <span className="sr-only">Heading</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleFormatHeading(1)}>
                  <Heading1 className="size-4" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormatHeading(2)}>
                  <Heading2 className="size-4" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormatHeading(3)}>
                  <Heading3 className="size-4" />
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolbarButton icon={Quote} label="Quote" onClick={handleFormatQuote} />
            <ToolbarButton icon={List} label="Bullet List" onClick={handleFormatBulletList} />
            <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={handleFormatNumberedList} />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton icon={CodeSquare} label="Code Block" onClick={handleFormatCodeBlock} />
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleVimMode}
                  className={cn(
                    'text-muted-foreground hover:text-foreground',
                    vimModeEnabled && 'bg-accent text-foreground'
                  )}
                >
                  <Terminal className="size-4" />
                  <span className="sr-only">Vim Mode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {vimModeEnabled ? 'Disable Vim Mode' : 'Enable Vim Mode'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {mounted && theme === 'dark' ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  <span className="sr-only">Toggle Theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                  <Keyboard className="size-4" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAbout(true)}>
                  <Info className="size-4" />
                  About Poe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSplash(true)}>
                  <Sparkles className="size-4" />
                  Show Splash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

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
