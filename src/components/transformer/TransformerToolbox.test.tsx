import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TransformerToolbox } from './TransformerToolbox'
import { OPERATIONS } from './constants'

// Mock dnd-kit's useDraggable
const mockUseDraggable = vi.fn()
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    useDraggable: (args: any) => mockUseDraggable(args),
  }
})

describe('TransformerToolbox', () => {
  const mockOnAddStep = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation for useDraggable
    mockUseDraggable.mockReturnValue({
      attributes: { 'data-testid': 'draggable-attr' },
      listeners: { 'data-testid': 'draggable-listener' },
      setNodeRef: vi.fn(),
      isDragging: false,
    })
  })

  it('should render all operations initially', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    OPERATIONS.forEach((op) => {
      expect(screen.getByText(op.name)).toBeInTheDocument()
    })
  })

  it('should display operation descriptions', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    OPERATIONS.forEach((op) => {
      expect(screen.getByText(op.description)).toBeInTheDocument()
    })
  })

  it('should have a search input', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should filter operations by search query', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')

    await user.type(searchInput, 'trim')

    // Should show Trim Whitespace
    expect(screen.getByText('Trim Whitespace')).toBeInTheDocument()

    // Should not show other operations
    expect(screen.queryByText('Replace Text')).not.toBeInTheDocument()
    expect(screen.queryByText('Sort Lines')).not.toBeInTheDocument()
  })

  it('should filter operations case-insensitively', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')

    await user.type(searchInput, 'REPLACE')

    expect(screen.getByText('Replace Text')).toBeInTheDocument()
  })

  it('should show empty state when no operations match', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')

    await user.type(searchInput, 'nonexistent operation')

    expect(screen.getByText('No operations found.')).toBeInTheDocument()
  })

  it('should call onAddStep when operation is clicked', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const trimButton = screen.getByText('Trim Whitespace').closest('button')
    expect(trimButton).not.toBeNull()

    await user.click(trimButton!)

    expect(mockOnAddStep).toHaveBeenCalledTimes(1)
    expect(mockOnAddStep).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'trim',
        name: 'Trim Whitespace',
      })
    )
  })

  it('should set drag data when operation is dragged', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    // Verify useDraggable was called with correct data for each operation
    const trimOp = OPERATIONS.find((op) => op.id === 'trim')
    expect(mockUseDraggable).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'toolbox-trim',
        data: {
          operation: trimOp,
        },
      })
    )
  })

  it('should apply draggable attributes to buttons', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const buttons = screen.getAllByRole('button').filter((btn) => {
      return OPERATIONS.some((op) => btn.textContent?.includes(op.name))
    })

    // Check if our mock attributes were applied
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('data-testid', 'draggable-attr')
    })
  })

  it('should clear search when input is cleared', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')

    // Type search query
    await user.type(searchInput, 'trim')
    expect(screen.queryByText('Replace Text')).not.toBeInTheDocument()

    // Clear search
    await user.clear(searchInput)

    // All operations should be visible again
    OPERATIONS.forEach((op) => {
      expect(screen.getByText(op.name)).toBeInTheDocument()
    })
  })

  it('should display "Operations" header', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    expect(screen.getByText('Operations')).toBeInTheDocument()
  })

  it('should pass complete operation object to onAddStep', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const replaceButton = screen.getByText('Replace Text').closest('button')
    await user.click(replaceButton!)

    const replaceOp = OPERATIONS.find((op) => op.id === 'replace')
    expect(mockOnAddStep).toHaveBeenCalledWith(replaceOp)
  })

  it('should filter operations by categories', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    // Initially "All" is active, find "Text" category button
    const textCategoryButton = screen.getByText('text', { selector: 'button' })
    await user.click(textCategoryButton)

    // "Trim Whitespace" is in Text category
    expect(screen.getByText('Trim Whitespace')).toBeInTheDocument()
    // "Sort Lines" is in Lines category, should be hidden
    expect(screen.queryByText('Sort Lines')).not.toBeInTheDocument()

    // Switch to "Lines" category
    const linesCategoryButton = screen.getByText('lines', { selector: 'button' })
    await user.click(linesCategoryButton)

    // "Sort Lines" should now be visible
    expect(screen.getByText('Sort Lines')).toBeInTheDocument()
    // "Trim Whitespace" should be hidden
    expect(screen.queryByText('Trim Whitespace')).not.toBeInTheDocument()

    // Switch to "Structure" category
    const structureCategoryButton = screen.getByText('structure', { selector: 'button' })
    await user.click(structureCategoryButton)
    expect(screen.getByText('Join Lines')).toBeInTheDocument()
    expect(screen.queryByText('Sort Lines')).not.toBeInTheDocument()
  })

  it('should handle multiple search queries sequentially', async () => {
    const user = userEvent.setup()
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const searchInput = screen.getByPlaceholderText('Search operations...')

    // First search
    await user.type(searchInput, 'trim')
    expect(screen.getByText('Trim Whitespace')).toBeInTheDocument()
    expect(screen.queryByText('Replace Text')).not.toBeInTheDocument()

    // Clear and new search
    await user.clear(searchInput)
    await user.type(searchInput, 'replace')
    expect(screen.getByText('Replace Text')).toBeInTheDocument()
    expect(screen.queryByText('Trim Whitespace')).not.toBeInTheDocument()
  })
})
