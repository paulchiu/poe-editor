import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ChangeCaseConfig } from './ChangeCaseConfig'

describe('ChangeCaseConfig', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all case mode options', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    expect(screen.getByText('UPPER')).toBeInTheDocument()
    expect(screen.getByText('lower')).toBeInTheDocument()
    expect(screen.getByText('Title Case')).toBeInTheDocument()
    expect(screen.getByText('camelCase')).toBeInTheDocument()
    expect(screen.getByText('snake_case')).toBeInTheDocument()
    expect(screen.getByText('kebab-case')).toBeInTheDocument()
    expect(screen.getByText('PascalCase')).toBeInTheDocument()
    expect(screen.getByText('CONST_CASE')).toBeInTheDocument()
  })

  it('should highlight the selected mode', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    const upperButton = screen.getByText('UPPER')
    expect(upperButton).toHaveClass('bg-background')
  })

  it('should call onChange when a mode is selected', async () => {
    const user = userEvent.setup()
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    const lowerButton = screen.getByText('lower')
    await user.click(lowerButton)

    expect(mockOnChange).toHaveBeenCalledWith({ mode: 'lower' })
  })

  it('should preserve other config values when changing mode', async () => {
    const user = userEvent.setup()
    const config = { mode: 'upper', lines: true, customField: 'value' }
    render(<ChangeCaseConfig config={config} onChange={mockOnChange} />)

    const lowerButton = screen.getByText('lower')
    await user.click(lowerButton)

    expect(mockOnChange).toHaveBeenCalledWith({
      mode: 'lower',
      lines: true,
      customField: 'value',
    })
  })

  it('should handle all mode selections correctly', async () => {
    const user = userEvent.setup()
    const modes = [
      { id: 'upper', label: 'UPPER' },
      { id: 'lower', label: 'lower' },
      { id: 'title', label: 'Title Case' },
      { id: 'camel', label: 'camelCase' },
      { id: 'snake', label: 'snake_case' },
      { id: 'kebab', label: 'kebab-case' },
      { id: 'pascal', label: 'PascalCase' },
      { id: 'constant', label: 'CONST_CASE' },
    ]

    for (const mode of modes) {
      mockOnChange.mockClear()
      const { unmount } = render(
        <ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />
      )

      const button = screen.getByText(mode.label)
      await user.click(button)

      expect(mockOnChange).toHaveBeenCalledWith({ mode: mode.id })

      unmount() // Clean up before next iteration
    }
  })

  it('should have Case Mode label', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    expect(screen.getByText('Case Mode')).toBeInTheDocument()
  })
})
