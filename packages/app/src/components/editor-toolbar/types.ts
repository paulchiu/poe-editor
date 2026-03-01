import type { RefObject } from 'react'
import type { TableAction } from '@/components/editor'
import type { TransformationPipeline } from '@/components/transformer/types'

export interface EditorToolbarProps {
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
  onFormatTaskList: () => void
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
  showTocPanel?: boolean
  toggleShowTocPanel?: () => void
  showEmojiPicker?: boolean
  toggleShowEmojiPicker?: () => void
  documentMenuRef?: RefObject<HTMLButtonElement | null>
  spellCheck?: boolean
  toggleSpellCheck?: () => void
  displayLineMotion?: boolean
  toggleDisplayLineMotion?: () => void
}
