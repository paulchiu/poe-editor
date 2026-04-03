import { useRef } from 'react'
import type { ElementType, MutableRefObject, ReactElement } from 'react'
import {
  AlignLeft,
  Bold,
  Check,
  Code,
  CodeSquare,
  Columns,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Plus,
  Quote,
  Rows,
  Table,
  Trash2,
  Wand2,
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
import type { TableAction } from '@/components/editor'
import type { EditorToolbarProps } from '@/components/editor-toolbar/types'
import { ToolbarButton } from '@/components/editor-toolbar/ToolbarButton'
import { PipelinesToolbarGroup } from '@/components/editor-toolbar/PipelinesToolbarGroup'

interface DeferredActionItem {
  icon: ElementType
  label: string
  onAction: () => void
}

interface TableActionItem {
  action: TableAction
  icon: ElementType
  label: string
  className?: string
}

type FormattingToolbarGroupProps = Pick<
  EditorToolbarProps,
  | 'onFormatBold'
  | 'onFormatItalic'
  | 'onFormatLink'
  | 'onFormatCode'
  | 'onFormatHeading'
  | 'onFormatQuote'
  | 'onFormatBulletList'
  | 'onFormatNumberedList'
  | 'onFormatTaskList'
  | 'onFormatCodeBlock'
  | 'onTableAction'
  | 'onFormatAllTables'
  | 'isInTable'
  | 'onOpenTransformer'
  | 'pipelines'
  | 'onApplyPipeline'
  | 'onEditPipeline'
  | 'onDeletePipeline'
  | 'onReorderPipelines'
>

function runDeferredAction(actionRef: MutableRefObject<boolean>, action: () => void): void {
  actionRef.current = true
  setTimeout(() => {
    action()
  }, 50)
}

function handleMenuCloseAutoFocus(event: Event, actionRef: MutableRefObject<boolean>): void {
  if (!actionRef.current) {
    return
  }

  event.preventDefault()
  actionRef.current = false
}

function renderTableAction(
  item: TableActionItem,
  onTableAction: (action: TableAction) => void
): ReactElement {
  const ItemIcon = item.icon

  return (
    <DropdownMenuItem
      key={item.action}
      onClick={() => onTableAction(item.action)}
      className={item.className}
    >
      <ItemIcon className="size-4" /> {item.label}
    </DropdownMenuItem>
  )
}

/**
 * Renders text-formatting and transformation controls.
 * @param props - Component props.
 * @returns Formatting toolbar group element.
 */
export function FormattingToolbarGroup({
  onFormatBold,
  onFormatItalic,
  onFormatLink,
  onFormatCode,
  onFormatHeading,
  onFormatQuote,
  onFormatBulletList,
  onFormatNumberedList,
  onFormatTaskList,
  onFormatCodeBlock,
  onTableAction,
  onFormatAllTables,
  isInTable,
  onOpenTransformer,
  pipelines,
  onApplyPipeline,
  onEditPipeline,
  onDeletePipeline,
  onReorderPipelines,
}: FormattingToolbarGroupProps): ReactElement {
  const headingActionRef = useRef(false)
  const listActionRef = useRef(false)

  const headingItems: DeferredActionItem[] = [
    { icon: Heading1, label: 'Heading 1', onAction: () => onFormatHeading(1) },
    { icon: Heading2, label: 'Heading 2', onAction: () => onFormatHeading(2) },
    { icon: Heading3, label: 'Heading 3', onAction: () => onFormatHeading(3) },
  ]

  const listItems: DeferredActionItem[] = [
    { icon: List, label: 'Bullet List', onAction: onFormatBulletList },
    { icon: ListOrdered, label: 'Numbered List', onAction: onFormatNumberedList },
    { icon: Check, label: 'Task List', onAction: onFormatTaskList },
  ]

  const rowTableActions: TableActionItem[] = [
    { action: 'insert-row-above', icon: Plus, label: 'Add Row Above' },
    { action: 'insert-row-below', icon: Plus, label: 'Add Row Below' },
    { action: 'delete-row', icon: Trash2, label: 'Delete Row', className: 'text-destructive' },
  ]

  const columnTableActions: TableActionItem[] = [
    { action: 'insert-col-left', icon: Plus, label: 'Add Column Left' },
    { action: 'insert-col-right', icon: Plus, label: 'Add Column Right' },
    { action: 'delete-col', icon: Trash2, label: 'Delete Column', className: 'text-destructive' },
  ]

  return (
    <div className="order-3 md:order-0 w-full md:w-auto mt-2 md:mt-0 flex-none overflow-x-auto flex items-center gap-1 bg-muted/50 rounded-lg p-1 scrollbar-hide">
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
          onCloseAutoFocus={(event) => handleMenuCloseAutoFocus(event, headingActionRef)}
        >
          {headingItems.map((item) => {
            const ItemIcon = item.icon

            return (
              <DropdownMenuItem
                key={item.label}
                onClick={() => runDeferredAction(headingActionRef, item.onAction)}
              >
                <ItemIcon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton icon={Quote} label="Quote" onClick={onFormatQuote} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <List className="size-4" />
            <span className="sr-only">Lists</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          onCloseAutoFocus={(event) => handleMenuCloseAutoFocus(event, listActionRef)}
        >
          {listItems.map((item) => {
            const ItemIcon = item.icon

            return (
              <DropdownMenuItem
                key={item.label}
                onClick={() => runDeferredAction(listActionRef, item.onAction)}
              >
                <ItemIcon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

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
            <>
              <DropdownMenuItem onClick={() => onTableAction('insert-table')}>
                <Plus className="size-4" />
                Insert Table
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onFormatAllTables}>
                <AlignLeft className="size-4" /> Format All Tables
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Rows className="size-4" /> Rows
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {rowTableActions.map((item) => renderTableAction(item, onTableAction))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Columns className="size-4" /> Columns
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {columnTableActions.map((item) => renderTableAction(item, onTableAction))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTableAction('format-table')}>
                <AlignLeft className="size-4" /> Format Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFormatAllTables}>
                <AlignLeft className="size-4" /> Format All Tables
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton icon={Wand2} label="Transform Selection" onClick={onOpenTransformer} />

      {pipelines && pipelines.length > 0 ? (
        <PipelinesToolbarGroup
          pipelines={pipelines}
          onApplyPipeline={onApplyPipeline}
          onEditPipeline={onEditPipeline}
          onDeletePipeline={onDeletePipeline}
          onReorderPipelines={onReorderPipelines}
        />
      ) : null}
    </div>
  )
}
