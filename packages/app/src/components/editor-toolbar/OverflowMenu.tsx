import type { ElementType, ReactElement } from 'react'
import {
  AlignLeft,
  ArrowRightLeft,
  File,
  Hash,
  Info,
  Keyboard,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Smile,
  Sparkles,
  SpellCheck,
  Sun,
  Terminal,
  WholeWord,
  WrapText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/classnames'
import type { EditorToolbarProps } from '@/components/editor-toolbar/types'

interface OverflowToggleItem {
  icon: ElementType
  label: string
  onClick?: () => void
}

type OverflowMenuProps = Pick<
  EditorToolbarProps,
  | 'vimModeEnabled'
  | 'toggleVimMode'
  | 'theme'
  | 'mounted'
  | 'toggleTheme'
  | 'showWordCount'
  | 'toggleWordCount'
  | 'showLineNumbers'
  | 'toggleLineNumbers'
  | 'spellCheck'
  | 'toggleSpellCheck'
  | 'showTocPanel'
  | 'toggleShowTocPanel'
  | 'showEmojiPicker'
  | 'toggleShowEmojiPicker'
  | 'displayLineMotion'
  | 'toggleDisplayLineMotion'
  | 'startEmpty'
  | 'toggleStartEmpty'
  | 'onOpenImportExport'
  | 'onReset'
  | 'setShowShortcuts'
  | 'setShowAbout'
  | 'setShowSplash'
>

function renderOverflowItem(item: OverflowToggleItem): ReactElement {
  const ItemIcon = item.icon

  return (
    <DropdownMenuItem key={item.label} onClick={item.onClick}>
      <ItemIcon className="size-4" />
      {item.label}
    </DropdownMenuItem>
  )
}

/**
 * Renders Vim/theme controls and the overflow actions dropdown.
 * @param props - Component props.
 * @returns Overflow menu controls element.
 */
export function OverflowMenu({
  vimModeEnabled,
  toggleVimMode,
  theme,
  mounted,
  toggleTheme,
  showWordCount,
  toggleWordCount,
  showLineNumbers,
  toggleLineNumbers,
  spellCheck,
  toggleSpellCheck,
  showTocPanel,
  toggleShowTocPanel,
  showEmojiPicker,
  toggleShowEmojiPicker,
  displayLineMotion,
  toggleDisplayLineMotion,
  startEmpty,
  toggleStartEmpty,
  onOpenImportExport,
  onReset,
  setShowShortcuts,
  setShowAbout,
  setShowSplash,
}: OverflowMenuProps): ReactElement {
  const overflowItems: OverflowToggleItem[] = [
    {
      icon: WholeWord,
      label: showWordCount ? 'Hide Word Count' : 'Show Word Count',
      onClick: toggleWordCount,
    },
    {
      icon: Hash,
      label: showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers',
      onClick: toggleLineNumbers,
    },
    {
      icon: SpellCheck,
      label: spellCheck ? 'Disable Spell Check' : 'Enable Spell Check',
      onClick: toggleSpellCheck,
    },
    {
      icon: AlignLeft,
      label: showTocPanel ? 'Hide TOC Panel' : 'Show TOC Panel',
      onClick: toggleShowTocPanel,
    },
    {
      icon: Smile,
      label: showEmojiPicker ? 'Disable Emoji Picker' : 'Enable Emoji Picker',
      onClick: toggleShowEmojiPicker,
    },
  ]

  const isDarkMode = mounted && theme === 'dark'

  return (
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
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="sr-only">Toggle Theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
          {overflowItems.map(renderOverflowItem)}

          {vimModeEnabled ? (
            <DropdownMenuItem onClick={toggleDisplayLineMotion}>
              <WrapText className="size-4" />
              {displayLineMotion ? 'Logical Line Boundaries' : 'Display Line Boundaries'}
            </DropdownMenuItem>
          ) : null}

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
  )
}
