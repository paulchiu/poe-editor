import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EditorToolbar } from './EditorToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

const mockPipelines = [
  { id: '1', name: 'Pipeline 1', icon: '🪄', steps: [] },
  { id: '2', name: 'Pipeline 2', icon: '✨', steps: [] },
]

describe('EditorToolbar', () => {
  const defaultProps = {
    documentName: 'test.md',
    isOverLimit: false,
    vimModeEnabled: false,
    theme: 'light',
    mounted: true,
    onNew: vi.fn(),
    onRename: vi.fn(),
    onDownloadMarkdown: vi.fn(),
    onDownloadHTML: vi.fn(),
    onCopyLink: vi.fn(),
    onClear: vi.fn(),
    onFormatBold: vi.fn(),
    onFormatItalic: vi.fn(),
    onFormatLink: vi.fn(),
    onFormatCode: vi.fn(),
    onFormatHeading: vi.fn(),
    onFormatQuote: vi.fn(),
    onFormatBulletList: vi.fn(),
    onFormatNumberedList: vi.fn(),
    onFormatCodeBlock: vi.fn(),

    onTableAction: vi.fn(),
    isInTable: false,
    toggleVimMode: vi.fn(),
    toggleTheme: vi.fn(),
    setShowShortcuts: vi.fn(),
    setShowAbout: vi.fn(),
    setShowSplash: vi.fn(),
  }

  it('renders custom pipelines', () => {
    render(
      <TooltipProvider>
        <EditorToolbar {...defaultProps} pipelines={mockPipelines} />
      </TooltipProvider>
    )

    expect(screen.getByLabelText('Pipeline 1')).toBeDefined()
    expect(screen.getByLabelText('Pipeline 2')).toBeDefined()
  })

  it('triggers onApplyPipeline when pipeline button is clicked', () => {
    const onApplyPipeline = vi.fn()
    render(
      <TooltipProvider>
        <EditorToolbar
          {...defaultProps}
          pipelines={mockPipelines}
          onApplyPipeline={onApplyPipeline}
        />
      </TooltipProvider>
    )

    fireEvent.click(screen.getByLabelText('Pipeline 1'))
    expect(onApplyPipeline).toHaveBeenCalledWith(mockPipelines[0])
  })

  it('handles drag start for custom pipelines', () => {
    render(
      <TooltipProvider>
        <EditorToolbar {...defaultProps} pipelines={mockPipelines} />
      </TooltipProvider>
    )

    const pipeline1 = screen.getByLabelText('Pipeline 1').closest('button')
    expect(pipeline1).toBeDefined()

    const dragStartEvent = fireEvent.dragStart(pipeline1!, {
      dataTransfer: {
        setDragImage: vi.fn(),
        setData: vi.fn(),
        effectAllowed: '',
      },
    })
    expect(dragStartEvent).toBe(true)
  })
})
