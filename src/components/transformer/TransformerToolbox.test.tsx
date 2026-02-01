import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TransformerToolbox } from './TransformerToolbox'
import { OPERATIONS } from './constants'

describe('TransformerToolbox', () => {
  const mockOnAddStep = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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

    const trimButton = screen.getByText('Trim Whitespace').closest('button')
    expect(trimButton).not.toBeNull()

    const dataTransfer = {
      setData: vi.fn(),
    }

    fireEvent.dragStart(trimButton!, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/json',
      expect.stringContaining('"id":"trim"')
    )
  })

  it('should make all operation buttons draggable', () => {
    render(<TransformerToolbox onAddStep={mockOnAddStep} />)

    const buttons = screen.getAllByRole('button').filter((btn) => {
      return OPERATIONS.some((op) => btn.textContent?.includes(op.name))
    })

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('draggable', 'true')
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
