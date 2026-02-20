import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EditorToolbar } from './EditorToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

const mockPipelines = [
  { id: '1', name: 'Pipeline 1', icon: '🪄', steps: [] },
  { id: '2', name: 'Pipeline 2', icon: '✨', steps: [] },
]

describe('EditorToolbar', () => {
  const createDefaultProps = () => ({
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
    onOpenTransformer: vi.fn(),
    onOpenImportExport: vi.fn(),
    onReset: vi.fn(),
    toggleWordCount: vi.fn(),
    toggleLineNumbers: vi.fn(),
    toggleStartEmpty: vi.fn(),
    toggleSpellCheck: vi.fn(),
    showWordCount: false,
    showLineNumbers: false,
    startEmpty: false,
    spellCheck: false,
  })

  const renderToolbar = (overrides = {}) => {
    const props = { ...createDefaultProps(), ...overrides }

    render(
      <TooltipProvider>
        <EditorToolbar {...props} pipelines={mockPipelines} />
      </TooltipProvider>
    )

    return props
  }

  it('renders custom pipelines', () => {
    renderToolbar()

    expect(screen.getByLabelText('Pipeline 1')).toBeDefined()
    expect(screen.getByLabelText('Pipeline 2')).toBeDefined()
  })

  it('triggers onApplyPipeline when pipeline button is clicked', () => {
    const onApplyPipeline = vi.fn()
    renderToolbar({ onApplyPipeline })

    fireEvent.click(screen.getByLabelText('Pipeline 1'))
    expect(onApplyPipeline).toHaveBeenCalledWith(mockPipelines[0])
  })

  it('handles drag start for custom pipelines', () => {
    renderToolbar()

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

  it('triggers direct toolbar actions', async () => {
    const user = userEvent.setup()
    const props = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Bold' }))
    await user.click(screen.getByRole('button', { name: 'Italic' }))
    await user.click(screen.getByRole('button', { name: 'Link' }))
    await user.click(screen.getByRole('button', { name: 'Code' }))
    await user.click(screen.getByRole('button', { name: 'Quote' }))
    await user.click(screen.getByRole('button', { name: 'Bullet List' }))
    await user.click(screen.getByRole('button', { name: 'Numbered List' }))
    await user.click(screen.getByRole('button', { name: 'Code Block' }))
    await user.click(screen.getByRole('button', { name: 'Transform Selection' }))
    await user.click(screen.getByRole('button', { name: 'Vim Mode' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }))

    expect(props.onFormatBold).toHaveBeenCalledTimes(1)
    expect(props.onFormatItalic).toHaveBeenCalledTimes(1)
    expect(props.onFormatLink).toHaveBeenCalledTimes(1)
    expect(props.onFormatCode).toHaveBeenCalledTimes(1)
    expect(props.onFormatQuote).toHaveBeenCalledTimes(1)
    expect(props.onFormatBulletList).toHaveBeenCalledTimes(1)
    expect(props.onFormatNumberedList).toHaveBeenCalledTimes(1)
    expect(props.onFormatCodeBlock).toHaveBeenCalledTimes(1)
    expect(props.onOpenTransformer).toHaveBeenCalledTimes(1)
    expect(props.toggleVimMode).toHaveBeenCalledTimes(1)
    expect(props.toggleTheme).toHaveBeenCalledTimes(1)
  })

  it('triggers heading and table menu actions', async () => {
    const user = userEvent.setup()
    const props = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Heading' }))
    await user.click(await screen.findByText('Heading 2'))

    await waitFor(() => {
      expect(props.onFormatHeading).toHaveBeenCalledWith(2)
    })

    await user.click(screen.getByRole('button', { name: 'Table Operations' }))
    await user.click(await screen.findByText('Insert Table'))
    expect(props.onTableAction).toHaveBeenCalledWith('insert-table')
  })

  it('triggers document and overflow menu actions', async () => {
    const user = userEvent.setup()
    const props = renderToolbar()

    await user.click(screen.getByRole('button', { name: /test\.md/i }))
    await user.click(await screen.findByText('New'))
    expect(props.onNew).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /test\.md/i }))
    await user.click(await screen.findByText('Rename'))
    expect(props.onRename).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /test\.md/i }))
    await user.click(await screen.findByText('Copy Link'))
    expect(props.onCopyLink).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /test\.md/i }))
    await user.click(await screen.findByText('Clear'))
    await user.click(await screen.findByText('Confirm Clear'))
    expect(props.onClear).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Show Word Count'))
    expect(props.toggleWordCount).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Enable Spell Check'))
    expect(props.toggleSpellCheck).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Show Line Numbers'))
    expect(props.toggleLineNumbers).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Start with Empty Editor'))
    expect(props.toggleStartEmpty).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Import/Export Transformers'))
    expect(props.onOpenImportExport).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Reset App State'))
    expect(props.onReset).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Keyboard Shortcuts'))
    expect(props.setShowShortcuts).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('About Poe'))
    expect(props.setShowAbout).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(await screen.findByText('Show Splash'))
    expect(props.setShowSplash).toHaveBeenCalledWith(true)
  })
})
