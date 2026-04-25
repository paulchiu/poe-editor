import type { RefObject, ReactElement } from 'react'
import { EditorPane, type EditorPaneHandle } from '@/components/editor'
import { EditorToolbar, type EditorToolbarProps } from '@/components/EditorToolbar'
import { PreviewPane } from '@/components/PreviewPane'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/utils/classnames'
import type { TocHeading } from '@/utils/markdown'
import type { MermaidColorMode } from '@/utils/mermaidTheme'

type PoeEditorViewMode = 'split' | 'editor' | 'preview'

interface CursorPosition {
  lineNumber: number
  column: number
  isInTable: boolean
}

interface PoeEditorWorkspaceProps {
  editorToolbarProps: EditorToolbarProps
  isMobile: boolean
  viewMode: PoeEditorViewMode
  activeTab: 'editor' | 'preview'
  setViewMode: (mode: PoeEditorViewMode) => void
  sourceRef: RefObject<EditorPaneHandle | null>
  targetRef: RefObject<HTMLDivElement | null>
  content: string
  setContent: (nextContent: string) => void
  onCursorChange: (position: CursorPosition) => void
  editorTheme: 'light' | 'dark'
  onFormat: (type: 'bold' | 'italic' | 'link' | 'code') => void
  onCodeBlock: () => void
  vimModeEnabled: boolean
  displayLineMotion: boolean
  showWordCount: boolean
  showLineNumbers: boolean
  onToggleEditorLayout: () => void
  onTogglePreviewLayout: () => void
  spellCheck: boolean
  onSpellCheckChange: (enabled: boolean) => void
  showEmojiPicker: boolean
  htmlContent: string
  onTaskListToggle: (taskIndex: number, checked: boolean) => void
  onFrontMatterBooleanToggle: (key: string, checked: boolean) => void
  colorMode: MermaidColorMode
  tocHeadings: TocHeading[]
  showTocPanel: boolean
}

/**
 * Renders the editor toolbar and responsive editor/preview workspace.
 * @param props - Component props.
 * @returns Workspace content for Poe editor.
 */
export function PoeEditorWorkspace({
  editorToolbarProps,
  isMobile,
  viewMode,
  activeTab,
  setViewMode,
  sourceRef,
  targetRef,
  content,
  setContent,
  onCursorChange,
  editorTheme,
  onFormat,
  onCodeBlock,
  vimModeEnabled,
  displayLineMotion,
  showWordCount,
  showLineNumbers,
  onToggleEditorLayout,
  onTogglePreviewLayout,
  spellCheck,
  onSpellCheckChange,
  showEmojiPicker,
  htmlContent,
  onTaskListToggle,
  onFrontMatterBooleanToggle,
  colorMode,
  tocHeadings,
  showTocPanel,
}: PoeEditorWorkspaceProps): ReactElement {
  return (
    <>
      <div className="poe-editor-app-shell h-screen flex flex-col overflow-hidden bg-background">
        <EditorToolbar {...editorToolbarProps} />

        <main className="flex-1 overflow-hidden">
          {!isMobile ? (
            <div className="h-full p-4">
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                {viewMode === 'split' || viewMode === 'editor' ? (
                  <>
                    <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={30}>
                      <div className={cn('h-full', viewMode === 'split' && 'pr-2')}>
                        <EditorPane
                          ref={sourceRef}
                          value={content}
                          onChange={setContent}
                          onCursorChange={onCursorChange}
                          theme={editorTheme}
                          onFormat={onFormat}
                          onCodeBlock={onCodeBlock}
                          vimMode={vimModeEnabled}
                          displayLineMotion={displayLineMotion}
                          showWordCount={showWordCount}
                          showLineNumbers={showLineNumbers}
                          viewMode={viewMode}
                          onToggleLayout={onToggleEditorLayout}
                          spellCheck={spellCheck}
                          onSpellCheckChange={onSpellCheckChange}
                          emojiPickerEnabled={showEmojiPicker}
                        />
                      </div>
                    </ResizablePanel>
                    {viewMode === 'split' ? <ResizableHandle withHandle className="mx-2" /> : null}
                  </>
                ) : null}

                {viewMode === 'split' || viewMode === 'preview' ? (
                  <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={30}>
                    <div className={cn('h-full', viewMode === 'split' && 'pl-2')}>
                      <PreviewPane
                        ref={targetRef}
                        htmlContent={htmlContent}
                        onTaskListToggle={onTaskListToggle}
                        onFrontMatterBooleanToggle={onFrontMatterBooleanToggle}
                        viewMode={viewMode}
                        onToggleLayout={onTogglePreviewLayout}
                        colorMode={colorMode}
                        tocHeadings={tocHeadings}
                        showTocPanel={showTocPanel}
                      />
                    </div>
                  </ResizablePanel>
                ) : null}
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="w-full border-b border-border/60 bg-background h-10 flex">
                <button
                  onClick={() => setViewMode('editor')}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center text-sm font-medium transition-colors border-b-2',
                    activeTab === 'editor'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center text-sm font-medium transition-colors border-b-2',
                    activeTab === 'preview'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Preview
                </button>
              </div>

              <div className={cn('flex-1 p-4 mt-0', activeTab !== 'editor' && 'hidden')}>
                <EditorPane
                  ref={sourceRef}
                  value={content}
                  onChange={setContent}
                  onCursorChange={onCursorChange}
                  theme={editorTheme}
                  onFormat={onFormat}
                  onCodeBlock={onCodeBlock}
                  vimMode={vimModeEnabled}
                  displayLineMotion={displayLineMotion}
                  showWordCount={showWordCount}
                  showLineNumbers={showLineNumbers}
                  viewMode={activeTab === 'editor' ? 'editor' : 'preview'}
                  spellCheck={spellCheck}
                  onSpellCheckChange={onSpellCheckChange}
                  emojiPickerEnabled={showEmojiPicker}
                />
              </div>

              <div
                className={cn('flex-1 p-4 mt-0 overflow-auto', activeTab !== 'preview' && 'hidden')}
              >
                <PreviewPane
                  ref={targetRef}
                  htmlContent={htmlContent}
                  onTaskListToggle={onTaskListToggle}
                  onFrontMatterBooleanToggle={onFrontMatterBooleanToggle}
                  colorMode={colorMode}
                  tocHeadings={tocHeadings}
                  showTocPanel={showTocPanel}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="poe-editor-print-shell" aria-hidden="true">
        <PreviewPane
          htmlContent={htmlContent}
          colorMode="print"
          printFriendly
          bodyClassName="poe-editor-print-markdown-body"
          tocHeadings={tocHeadings}
          showTocPanel={showTocPanel}
        />
      </div>
    </>
  )
}
