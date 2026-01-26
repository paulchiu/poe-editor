'use client'

import { TabsContent } from '@/components/ui/tabs'

import { TabsTrigger } from '@/components/ui/tabs'

import { TabsList } from '@/components/ui/tabs'

import { Tabs } from '@/components/ui/tabs'

import { ResizableHandle } from '@/components/ui/resizable'

import { ResizablePanel } from '@/components/ui/resizable'

import { ResizablePanelGroup } from '@/components/ui/resizable'

import { DropdownMenuSubContent } from '@/components/ui/dropdown-menu'

import { DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'

import { DropdownMenuSub } from '@/components/ui/dropdown-menu'

import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

import { DropdownMenuContent } from '@/components/ui/dropdown-menu'

import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { DropdownMenu } from '@/components/ui/dropdown-menu'

import { TooltipContent } from '@/components/ui/tooltip'

import { Button } from '@/components/ui/button'

import { TooltipTrigger } from '@/components/ui/tooltip'

import { Tooltip } from '@/components/ui/tooltip'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
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
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VimStatusBar, type VimMode } from '@/components/vim-status-bar'
import { SplashScreen } from '@/components/splash-screen'
import { cn } from '@/lib/utils'

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
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

interface SimulatedEditorProps {
  vimModeEnabled?: boolean
  vimMode?: VimMode
}

function SimulatedEditor({ vimModeEnabled = false, vimMode = 'normal' }: SimulatedEditorProps) {
  const lines = [
    { num: 1, content: '# Welcome to Poe', color: 'text-cyan-400' },
    { num: 2, content: '', color: '' },
    {
      num: 3,
      content: 'A **modern** Markdown editor built for focus.',
      color: 'text-foreground',
    },
    { num: 4, content: '', color: '' },
    { num: 5, content: '## Features', color: 'text-cyan-400' },
    { num: 6, content: '', color: '' },
    {
      num: 7,
      content: '- Live preview with split pane',
      color: 'text-foreground',
    },
    {
      num: 8,
      content: '- Vim mode for power users',
      color: 'text-foreground',
    },
    {
      num: 9,
      content: '- Dark and light themes',
      color: 'text-foreground',
    },
    {
      num: 10,
      content: '- Export to MD or HTML',
      color: 'text-foreground',
    },
    { num: 11, content: '', color: '' },
    {
      num: 12,
      content: '```javascript',
      color: 'text-emerald-400',
    },
    {
      num: 13,
      content: 'const editor = "Poe";',
      color: 'text-amber-300',
    },
    {
      num: 14,
      content: 'console.log(`Welcome to ${editor}`);',
      color: 'text-amber-300',
    },
    {
      num: 15,
      content: '```',
      color: 'text-emerald-400',
    },
    { num: 16, content: '', color: '' },
    {
      num: 17,
      content: '> Start writing your masterpiece today.',
      color: 'text-muted-foreground italic',
    },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {lines.map((line) => (
          <div key={line.num} className="flex">
            <span className="w-8 text-right pr-4 text-muted-foreground/50 select-none">
              {line.num}
            </span>
            <span className={cn('flex-1', line.color)}>{line.content || '\u00A0'}</span>
          </div>
        ))}
        <div className="flex">
          <span className="w-8 text-right pr-4 text-muted-foreground/50 select-none">18</span>
          <span className="animate-pulse text-foreground">|</span>
        </div>
      </div>
      {vimModeEnabled && (
        <VimStatusBar
          mode={vimMode}
          filePath="document.md"
          modified={false}
          lineNumber={18}
          columnNumber={1}
        />
      )}
    </div>
  )
}

function SimulatedPreview() {
  return (
    <div className="h-full overflow-auto bg-card rounded-lg p-6">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">Welcome to Poe</h1>
        <p className="text-muted-foreground mb-6">
          A <strong className="text-foreground">modern</strong> Markdown editor built for focus.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Features</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>Live preview with split pane</li>
          <li>Vim mode for power users</li>
          <li>Dark and light themes</li>
          <li>Export to MD or HTML</li>
        </ul>

        <div className="mt-6 rounded-lg bg-[#0d1117] p-4 font-mono text-sm">
          <code className="text-amber-300">
            {`const editor = "Poe";`}
            <br />
            {`console.log(\`Welcome to \${editor}\`);`}
          </code>
        </div>

        <blockquote className="mt-6 border-l-4 border-border pl-4 italic text-muted-foreground">
          Start writing your masterpiece today.
        </blockquote>
      </article>
    </div>
  )
}

export function PoeEditor() {
  const [vimModeEnabled, setVimModeEnabled] = React.useState(false)
  const [vimMode, setVimMode] = React.useState<VimMode>('normal')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [showAbout, setShowAbout] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)
  const [showSplash, setShowSplash] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAbout(false)
        setShowShortcuts(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const toggleVimMode = () => {
    setVimModeEnabled(!vimModeEnabled)
    if (!vimModeEnabled) {
      setVimMode('normal')
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
            <p className="text-muted-foreground">
              Poe is a modern, distraction-free Markdown editor designed for writers, developers,
              and anyone who values focused writing.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Live preview with split-pane layout</li>
                <li>Vim mode for power users</li>
                <li>Dark and light theme support</li>
                <li>Export to Markdown or HTML</li>
                <li>Lightweight and fast</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              <p className="font-semibold mb-1">Version 1.0.0</p>
              <p>© 2024 Poe. Built with Next.js, React, and Tailwind CSS.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Master Poe with these essential keyboard shortcuts
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-6 pr-4">
              <div>
                <h3 className="font-semibold text-sm mb-3">Formatting</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bold</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + B</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Italic</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + I</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Code</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + `</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Link</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + K</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Editor</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Undo</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + Z</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Redo</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Ctrl + Shift + Z
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Find</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + F</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Save</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl + S</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Application</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Toggle Vim Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Ctrl + Shift + V
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Toggle Theme</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      Ctrl + Shift + L
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Close Modal</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Vim Mode</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enter Normal Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Esc</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enter Insert Mode</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">i</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Save & Quit</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">:wq</code>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isLoading={false} />}

      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-sm font-medium">
                <FileText className="size-4" />
                untitled.md
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>
                <FilePlus className="size-4" />
                New
              </DropdownMenuItem>
              <DropdownMenuItem>
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
                  <DropdownMenuItem>Markdown (.md)</DropdownMenuItem>
                  <DropdownMenuItem>HTML (.html)</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>
                <Link2 className="size-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" />
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <ToolbarButton icon={Bold} label="Bold (Ctrl+B)" />
            <ToolbarButton icon={Italic} label="Italic (Ctrl+I)" />
            <ToolbarButton icon={Link} label="Link (Ctrl+K)" />
            <ToolbarButton icon={Code} label="Code (Ctrl+`)" />
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
                <DropdownMenuItem>
                  <Heading1 className="size-4" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heading2 className="size-4" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heading3 className="size-4" />
                  Heading 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolbarButton icon={Quote} label="Quote" />
            <ToolbarButton icon={List} label="Bullet List" />
            <ToolbarButton icon={ListOrdered} label="Numbered List" />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton icon={CodeSquare} label="Code Block" />
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
                    vimMode && 'bg-accent text-foreground'
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
                <DropdownMenuItem onClick={() => setShowAbout(true)}>
                  <Info className="size-4" />
                  About Poe
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                  <Keyboard className="size-4" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSplash(true)}>Show Splash</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="hidden md:block h-full p-4">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full pr-2">
                  <SimulatedEditor vimModeEnabled={vimModeEnabled} vimMode={vimMode} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="mx-2" />
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full pl-2">
                  <SimulatedPreview />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          <div className="md:hidden h-full flex flex-col">
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
                <SimulatedEditor vimModeEnabled={vimModeEnabled} vimMode={vimMode} />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 p-4 mt-0">
                <SimulatedPreview />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
