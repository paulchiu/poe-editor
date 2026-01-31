import { type ElementType } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Wand2,
} from 'lucide-react'
import { ICON_MAP } from '@/components/formatter/constants'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'
import type { TransformationPipeline } from '@/components/formatter/types'

interface ToolbarButtonProps {
  icon: ElementType
  label: string
  onClick?: () => void
  active?: boolean
}

/**
 * Individual toolbar button with tooltip
 * @param props - Component props
 * @returns Toolbar button component
 */
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

interface EditorToolbarProps {
  documentName: string
  isOverLimit: boolean
  vimModeEnabled: boolean
  theme: string | undefined
  mounted: boolean
  onNew: () => void
  onRename: () => void
  onDownloadMarkdown: () => void
  onDownloadHTML: () => void
  onCopyLink: () => void
  onClear: () => void
  onFormatBold: () => void
  onFormatItalic: () => void
  onFormatLink: () => void
  onFormatCode: () => void
  onFormatHeading: (level: number) => void
  onFormatQuote: () => void
  onFormatBulletList: () => void
  onFormatNumberedList: () => void
  onFormatCodeBlock: () => void
  toggleVimMode: () => void
  toggleTheme: () => void
  setShowShortcuts: (show: boolean) => void
  setShowAbout: (show: boolean) => void
  setShowSplash: (show: boolean) => void
  
  pipelines?: TransformationPipeline[]
  onOpenFormatter?: () => void
  onApplyPipeline?: (pipeline: TransformationPipeline) => void
}

/**
 * Main editor toolbar with document controls, formatting tools, and settings
 * @param props - Component props
 * @returns Editor toolbar component
 */
export function EditorToolbar({
  documentName,
  isOverLimit,
  vimModeEnabled,
  theme,
  mounted,
  onNew,
  onRename,
  onDownloadMarkdown,
  onDownloadHTML,
  onCopyLink,
  onClear,
  onFormatBold,
  onFormatItalic,
  onFormatLink,
  onFormatCode,
  onFormatHeading,
  onFormatQuote,
  onFormatBulletList,
  onFormatNumberedList,
  onFormatCodeBlock,
  toggleVimMode,
  toggleTheme,
  setShowShortcuts,
  setShowAbout,
  setShowSplash,
  pipelines,
  onOpenFormatter,
  onApplyPipeline,
}: EditorToolbarProps): ReactElement {
  return (
    <header
      className={cn(
        'h-14 border-b border-border/60 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 transition-colors',
        isOverLimit && 'border-destructive/50 bg-destructive/10'
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
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
          <DropdownMenuItem onClick={onClear}>
            <Trash2 className="size-4" />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <ToolbarButton icon={Bold} label="Bold (Cmd+B)" onClick={onFormatBold} />
        <ToolbarButton icon={Italic} label="Italic (Cmd+I)" onClick={onFormatItalic} />
        <ToolbarButton icon={Link} label="Link (Cmd+K)" onClick={onFormatLink} />
        <ToolbarButton icon={Code} label="Code (Cmd+E)" onClick={onFormatCode} />
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
            <DropdownMenuItem onClick={() => onFormatHeading(1)}>
              <Heading1 className="size-4" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFormatHeading(2)}>
              <Heading2 className="size-4" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFormatHeading(3)}>
              <Heading3 className="size-4" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton icon={Quote} label="Quote" onClick={onFormatQuote} />
        <ToolbarButton icon={List} label="Bullet List" onClick={onFormatBulletList} />
        <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={onFormatNumberedList} />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton icon={CodeSquare} label="Code Block" onClick={onFormatCodeBlock} />
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <ToolbarButton icon={Wand2} label="Formatter Builder" onClick={onOpenFormatter} />
        
        {pipelines && pipelines.length > 0 && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            {pipelines.map(pipeline => {
               const PipelineIcon = ICON_MAP[pipeline.icon]
               return (
                 <ToolbarButton 
                    key={pipeline.id} 
                    icon={() => PipelineIcon ? (
                      <PipelineIcon className="size-4" />
                    ) : (
                       <span className="text-sm px-0.5" role="img" aria-label={pipeline.name}>
                         {pipeline.icon}
                       </span>
                    )}
                    label={pipeline.name}
                    onClick={() => onApplyPipeline?.(pipeline)}
                 />
               )
            })}
          </>
        )}
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
          <TooltipContent>{vimModeEnabled ? 'Disable Vim Mode' : 'Enable Vim Mode'}</TooltipContent>
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
  )
}
