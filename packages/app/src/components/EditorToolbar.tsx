import type { ReactElement } from 'react'
import { DocumentMenu } from '@/components/editor-toolbar/DocumentMenu'
import { FormattingToolbarGroup } from '@/components/editor-toolbar/FormattingToolbarGroup'
import { OverflowMenu } from '@/components/editor-toolbar/OverflowMenu'
import type { EditorToolbarProps } from '@/components/editor-toolbar/types'
import { cn } from '@/utils/classnames'

export type { EditorToolbarProps } from '@/components/editor-toolbar/types'

/**
 * Main editor toolbar with document controls, formatting tools, and settings.
 * @param props - Component props.
 * @returns Editor toolbar component.
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
  onFormatTaskList,
  onFormatCodeBlock,
  onTableAction,
  onFormatAllTables,
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
  showTocPanel,
  toggleShowTocPanel,
  showEmojiPicker,
  toggleShowEmojiPicker,
  documentMenuRef,
  spellCheck,
  toggleSpellCheck,
  displayLineMotion,
  toggleDisplayLineMotion,
}: EditorToolbarProps): ReactElement {
  return (
    <header
      className={cn(
        'min-h-14 md:h-14 h-auto border-b border-border/60 bg-background/80 backdrop-blur-sm flex flex-wrap md:flex-nowrap items-center justify-between px-4 py-2 md:py-0 transition-colors',
        isOverLimit && 'border-destructive/50 bg-destructive/10'
      )}
    >
      <div className="order-1 md:order-none">
        <DocumentMenu
          documentName={documentName}
          documentMenuRef={documentMenuRef}
          isOverLimit={isOverLimit}
          onNew={onNew}
          onRename={onRename}
          onDownloadMarkdown={onDownloadMarkdown}
          onDownloadHTML={onDownloadHTML}
          onCopyLink={onCopyLink}
          onClear={onClear}
        />
      </div>

      <FormattingToolbarGroup
        onFormatBold={onFormatBold}
        onFormatItalic={onFormatItalic}
        onFormatLink={onFormatLink}
        onFormatCode={onFormatCode}
        onFormatHeading={onFormatHeading}
        onFormatQuote={onFormatQuote}
        onFormatBulletList={onFormatBulletList}
        onFormatNumberedList={onFormatNumberedList}
        onFormatTaskList={onFormatTaskList}
        onFormatCodeBlock={onFormatCodeBlock}
        onTableAction={onTableAction}
        onFormatAllTables={onFormatAllTables}
        isInTable={isInTable}
        onOpenTransformer={onOpenTransformer}
        pipelines={pipelines}
        onApplyPipeline={onApplyPipeline}
        onEditPipeline={onEditPipeline}
        onDeletePipeline={onDeletePipeline}
        onReorderPipelines={onReorderPipelines}
      />

      <OverflowMenu
        vimModeEnabled={vimModeEnabled}
        toggleVimMode={toggleVimMode}
        theme={theme}
        mounted={mounted}
        toggleTheme={toggleTheme}
        showWordCount={showWordCount}
        toggleWordCount={toggleWordCount}
        showLineNumbers={showLineNumbers}
        toggleLineNumbers={toggleLineNumbers}
        spellCheck={spellCheck}
        toggleSpellCheck={toggleSpellCheck}
        showTocPanel={showTocPanel}
        toggleShowTocPanel={toggleShowTocPanel}
        showEmojiPicker={showEmojiPicker}
        toggleShowEmojiPicker={toggleShowEmojiPicker}
        displayLineMotion={displayLineMotion}
        toggleDisplayLineMotion={toggleDisplayLineMotion}
        startEmpty={startEmpty}
        toggleStartEmpty={toggleStartEmpty}
        onOpenImportExport={onOpenImportExport}
        onReset={onReset}
        setShowShortcuts={setShowShortcuts}
        setShowAbout={setShowAbout}
        setShowSplash={setShowSplash}
      />
    </header>
  )
}
