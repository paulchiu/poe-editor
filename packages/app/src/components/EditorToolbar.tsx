import { type ElementType, forwardRef, useState, useRef, type RefObject } from 'react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DraggableAttributes,
  closestCenter,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
  File,
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
  ArrowRightLeft,
  RotateCcw,
  WholeWord,
  Hash,
  Table,
  Plus,
  AlignLeft,
  Columns,
  Rows,
  SpellCheck,
} from 'lucide-react'
import { ICON_MAP } from '@/components/transformer/constants'
import { cn } from '@/utils/classnames'
import type { ReactElement } from 'react'
import type { TransformationPipeline } from '@/components/transformer/types'
import type { TableAction } from '@/components/editor'

/**
 * Props for the ToolbarButton component
 */
interface ToolbarButtonProps {
  icon: ElementType
  label: string
  onClick?: () => void
  active?: boolean
  allowDrag?: boolean
  className?: string
  dragAttributes?: DraggableAttributes
  dragListeners?: SyntheticListenerMap
  tooltipDisabled?: boolean
}

/**
 * Individual toolbar button with tooltip
 * @param props - Component props
 * @returns Toolbar button component
 */
const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      icon: Icon,
      label,
      onClick,
      active = false,
      allowDrag = false,
      className,
      dragAttributes,
      dragListeners,
      tooltipDisabled,
    },
    ref
  ) => {
    const button = (
      <Button
        ref={ref}
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        onMouseDown={allowDrag ? undefined : (e) => e.preventDefault()}
        style={{ touchAction: allowDrag ? 'none' : undefined }}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          active && 'bg-accent text-foreground',
          className
        )}
        {...dragAttributes}
        {...dragListeners}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    )

    if (tooltipDisabled) {
      return button
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }
)
ToolbarButton.displayName = 'ToolbarButton'

/**
 * Sortable wrapper for a transformation pipeline button
 * @param props - Component props
 * @returns Sortable pipeline button
 */
function SortablePipelineButton({
  pipeline,
  isActive,
  onApply,
  onEdit,
  onDeleteRequest,
}: {
  pipeline: TransformationPipeline
  isActive: boolean
  onApply?: (pipeline: TransformationPipeline) => void
  onEdit?: (pipeline: TransformationPipeline) => void
  onDeleteRequest?: (pipeline: TransformationPipeline) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pipeline.id,
    data: { pipeline },
  })

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const PipelineIcon = ICON_MAP[pipeline.icon]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-opacity flex items-center',
        isActive && 'cursor-grabbing',
        !isActive && 'cursor-grab'
      )}
    >
      <ContextMenu onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <div>
            <ToolbarButton
              icon={() =>
                PipelineIcon ? (
                  <PipelineIcon className="size-4" />
                ) : (
                  <span className="text-sm px-0.5" role="img" aria-label={pipeline.name}>
                    {pipeline.icon}
                  </span>
                )
              }
              label={pipeline.name}
              onClick={() => onApply?.(pipeline)}
              allowDrag
              className={!PipelineIcon ? 'w-auto px-2 min-w-8' : undefined}
              dragAttributes={attributes}
              dragListeners={listeners}
              tooltipDisabled={isContextMenuOpen}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEdit?.(pipeline)}>
            <Pencil className="size-4" />
            Edit Transformer
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={() => onDeleteRequest?.(pipeline)}>
            <Trash2 className="size-4" />
            Delete Transformer
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
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
  onTableAction: (action: TableAction) => void
  isInTable: boolean
  toggleVimMode: () => void
  toggleTheme: () => void
  setShowShortcuts: (show: boolean) => void
  setShowAbout: (show: boolean) => void
  setShowSplash: (show: boolean) => void

  pipelines?: TransformationPipeline[]
  onOpenTransformer?: () => void
  onApplyPipeline?: (pipeline: TransformationPipeline) => void
  onOpenImportExport?: () => void
  onEditPipeline?: (pipeline: TransformationPipeline) => void
  onDeletePipeline?: (id: string) => void
  onReorderPipelines?: (pipelines: TransformationPipeline[]) => void
  onReset?: () => void
  showWordCount?: boolean
  toggleWordCount?: () => void
  showLineNumbers?: boolean
  toggleLineNumbers?: () => void
  startEmpty?: boolean
  toggleStartEmpty?: () => void
  documentMenuRef?: RefObject<HTMLButtonElement | null>
  spellCheck?: boolean
  toggleSpellCheck?: () => void
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
  onTableAction,
  isInTable,
  toggleVimMode,
  toggleTheme,
  setShowShortcuts,
  setShowAbout,
  setShowSplash,
  pipelines,
  onOpenTransformer,
  onApplyPipeline,
  onOpenImportExport,
  onEditPipeline,
  onDeletePipeline,
  onReorderPipelines,
  onReset,
  showWordCount,
  toggleWordCount,
  showLineNumbers,
  toggleLineNumbers,
  startEmpty,
  toggleStartEmpty,
  documentMenuRef,
  spellCheck,
  toggleSpellCheck,
}: EditorToolbarProps): ReactElement {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const [pipelineToDelete, setPipelineToDelete] = useState<TransformationPipeline | null>(null)
  const [activeDragPipeline, setActiveDragPipeline] = useState<TransformationPipeline | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const headingActionRef = useRef(false)

  const handleClearSelect = (e: Event) => {
    if (!isConfirmingClear) {
      e.preventDefault()
      setIsConfirmingClear(true)
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false)
      }, 3000)
    } else {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      setIsConfirmingClear(false)
      onClear()
    }
  }

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.pipeline) {
      setActiveDragPipeline(event.active.data.current.pipeline)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragPipeline(null)
    const { active, over } = event

    if (!over || !pipelines) return

    if (active.id !== over.id) {
      const oldIndex = pipelines.findIndex((p) => p.id === active.id)
      const newIndex = pipelines.findIndex((p) => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPipelines = arrayMove(pipelines, oldIndex, newIndex)
        onReorderPipelines?.(newPipelines)
      }
    }
  }

  return (
    <header
      className={cn(
        'min-h-14 md:h-14 h-auto border-b border-border/60 bg-background/80 backdrop-blur-sm flex flex-wrap md:flex-nowrap items-center justify-between px-4 py-2 md:py-0 transition-colors',
        isOverLimit && 'border-destructive/50 bg-destructive/10'
      )}
    >
      <div className="order-1 md:order-none">
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
      </div>

      <div className="order-3 md:order-none w-full md:w-auto mt-2 md:mt-0 flex-none overflow-x-auto flex items-center gap-1 bg-muted/50 rounded-lg p-1 scrollbar-hide">
        <ToolbarButton icon={Bold} label="Bold" onClick={onFormatBold} />
        <ToolbarButton icon={Italic} label="Italic" onClick={onFormatItalic} />
        <ToolbarButton icon={Link} label="Link" onClick={onFormatLink} />
        <ToolbarButton icon={Code} label="Code" onClick={onFormatCode} />
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
          <DropdownMenuContent
            onCloseAutoFocus={(e) => {
              if (headingActionRef.current) {
                e.preventDefault()
                headingActionRef.current = false
              }
            }}
          >
            <DropdownMenuItem
              onClick={() => {
                headingActionRef.current = true
                setTimeout(() => onFormatHeading(1), 50)
              }}
            >
              <Heading1 className="size-4" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                headingActionRef.current = true
                setTimeout(() => onFormatHeading(2), 50)
              }}
            >
              <Heading2 className="size-4" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                headingActionRef.current = true
                setTimeout(() => onFormatHeading(3), 50)
              }}
            >
              <Heading3 className="size-4" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton icon={Quote} label="Quote" onClick={onFormatQuote} />
        <ToolbarButton icon={List} label="Bullet List" onClick={onFormatBulletList} />
        <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={onFormatNumberedList} />
        <ToolbarButton icon={CodeSquare} label="Code Block" onClick={onFormatCodeBlock} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                'text-muted-foreground hover:text-foreground',
                isInTable && 'bg-accent text-foreground'
              )}
            >
              <Table className="size-4" />
              <span className="sr-only">Table Operations</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!isInTable ? (
              <DropdownMenuItem onClick={() => onTableAction('insert-table')}>
                <Plus className="size-4" />
                Insert Table
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Rows className="size-4" /> Rows
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onTableAction('insert-row-above')}>
                      <Plus className="size-4" /> Add Row Above
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTableAction('insert-row-below')}>
                      <Plus className="size-4" /> Add Row Below
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTableAction('delete-row')}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" /> Delete Row
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Columns className="size-4" /> Columns
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onTableAction('insert-col-left')}>
                      <Plus className="size-4" /> Add Column Left
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTableAction('insert-col-right')}>
                      <Plus className="size-4" /> Add Column Right
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTableAction('delete-col')}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" /> Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTableAction('format-table')}>
                  <AlignLeft className="size-4" /> Format Table
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton icon={Wand2} label="Transform Selection" onClick={onOpenTransformer} />

        {pipelines && pipelines.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-1">
              <SortableContext items={pipelines} strategy={horizontalListSortingStrategy}>
                {pipelines.map((pipeline) => (
                  <SortablePipelineButton
                    key={pipeline.id}
                    pipeline={pipeline}
                    isActive={activeDragPipeline?.id === pipeline.id}
                    onApply={onApplyPipeline}
                    onEdit={onEditPipeline}
                    onDeleteRequest={setPipelineToDelete}
                  />
                ))}
              </SortableContext>
            </div>
            <DragOverlay>
              {activeDragPipeline ? (
                <div className="opacity-80">
                  <ToolbarButton
                    icon={() => {
                      const Icon = ICON_MAP[activeDragPipeline.icon]
                      return Icon ? (
                        <Icon className="size-4" />
                      ) : (
                        <span
                          className="text-sm px-0.5"
                          role="img"
                          aria-label={activeDragPipeline.name}
                        >
                          {activeDragPipeline.icon}
                        </span>
                      )
                    }}
                    label={activeDragPipeline.name}
                    className={
                      !ICON_MAP[activeDragPipeline.icon] ? 'w-auto px-2 min-w-8' : undefined
                    }
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        <AlertDialog
          open={!!pipelineToDelete}
          onOpenChange={(open) => !open && setPipelineToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transformer?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{pipelineToDelete?.name}&rdquo;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (pipelineToDelete) {
                    onDeletePipeline?.(pipelineToDelete.id)
                    setPipelineToDelete(null)
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex items-center gap-1 order-2 md:order-none ml-auto md:ml-0">
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
            <DropdownMenuItem onClick={toggleWordCount}>
              <WholeWord className="size-4" />
              {showWordCount ? 'Hide Word Count' : 'Show Word Count'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleSpellCheck}>
              <SpellCheck className="size-4" />
              {spellCheck ? 'Disable Spell Check' : 'Enable Spell Check'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleLineNumbers}>
              <Hash className="size-4" />
              {showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleStartEmpty}>
              <File className="size-4" />
              {startEmpty ? 'Start with Default Content' : 'Start with Empty Editor'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenImportExport}>
              <ArrowRightLeft className="size-4" />
              Import/Export Transformers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReset?.()}>
              <RotateCcw className="size-4" />
              Reset App State
            </DropdownMenuItem>
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
