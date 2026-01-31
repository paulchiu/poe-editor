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

  it('should render "Apply to Each Line" checkbox', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    expect(screen.getByText('Apply to Each Line')).toBeInTheDocument()
  })

  it('should check "Apply to Each Line" when lines is true', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper', lines: true }} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should uncheck "Apply to Each Line" when lines is false', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper', lines: false }} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('should default "Apply to Each Line" to checked when lines is undefined', () => {
    render(<ChangeCaseConfig config={{ mode: 'upper' }} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should call onChange when "Apply to Each Line" is toggled', async () => {
    const user = userEvent.setup()
    render(<ChangeCaseConfig config={{ mode: 'upper', lines: true }} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith({ mode: 'upper', lines: false })
  })

  it('should preserve other config values when toggling lines', async () => {
    const user = userEvent.setup()
    const config = { mode: 'upper', lines: true, customField: 'value' }
    render(<ChangeCaseConfig config={config} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      mode: 'upper',
      lines: false,
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

  it('should toggle checkbox from unchecked to checked', async () => {
    const user = userEvent.setup()
    render(<ChangeCaseConfig config={{ mode: 'upper', lines: false }} onChange={mockOnChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith({ mode: 'upper', lines: true })
  })
})
