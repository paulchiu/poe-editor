import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TransformerPreview } from './TransformerPreview'
import type { TransformationPipeline } from './types'

// Mock the formatter-engine
vi.mock('@/utils/formatter-engine', () => ({
  applyPipeline: vi.fn((text: string, pipeline: TransformationPipeline) => {
    // Simple mock implementation for testing
    if (pipeline.steps.length === 0) return text
    return text.toUpperCase() // Simple transformation for testing
  }),
}))

describe('TransformerPreview', () => {
  const mockPipeline: TransformationPipeline = {
    id: 'test-pipeline',
    name: 'Test Pipeline',
    icon: 'Wand',
    steps: [
      {
        id: 'step-1',
        operationId: 'change-case',
        config: { mode: 'upper' },
        enabled: true,
      },
    ],
  }

  const emptyPipeline: TransformationPipeline = {
    id: 'empty-pipeline',
    name: 'Empty Pipeline',
    icon: 'Wand',
    steps: [],
  }

  it('should render input and output sections', () => {
    render(<TransformerPreview pipeline={emptyPipeline} />)

    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
  })

  it('should display sample text initially', () => {
    render(<TransformerPreview pipeline={emptyPipeline} />)

    const textarea = screen.getByPlaceholderText(
      'Paste text here to test...'
    ) as HTMLTextAreaElement
    expect(textarea.value).toContain('Hello World')
  })

  it('should display initial text when provided via prop', () => {
    const customText = 'Custom initial text'
    render(<TransformerPreview pipeline={emptyPipeline} initialText={customText} />)

    const textarea = screen.getByPlaceholderText(
      'Paste text here to test...'
    ) as HTMLTextAreaElement
    expect(textarea.value).toBe(customText)
  })

  it('should update input text when initialText prop changes', () => {
    const { rerender } = render(
      <TransformerPreview pipeline={emptyPipeline} initialText="First text" />
    )
    expect(screen.getByPlaceholderText('Paste text here to test...')).toHaveValue('First text')

    rerender(<TransformerPreview pipeline={emptyPipeline} initialText="Second text" />)
    expect(screen.getByPlaceholderText('Paste text here to test...')).toHaveValue('Second text')
  })

  it('should display character count for input', () => {
    render(<TransformerPreview pipeline={emptyPipeline} />)

    // Sample text has a known length - there are two char counts (input and output)
    const charCounts = screen.getAllByText(/\d+ chars/)
    expect(charCounts.length).toBe(2)
  })

  it('should update output when input changes', async () => {
    const user = userEvent.setup()
    render(<TransformerPreview pipeline={mockPipeline} />)

    const textarea = screen.getByPlaceholderText('Paste text here to test...')

    await user.clear(textarea)
    await user.type(textarea, 'test input')

    // The mock applies uppercase transformation
    const output = screen.getByText('TEST INPUT')
    expect(output).toBeInTheDocument()
  })

  it('should display character count for output', () => {
    render(<TransformerPreview pipeline={mockPipeline} />)

    // Should have two character count displays (input and output)
    const charCounts = screen.getAllByText(/\d+ chars/)
    expect(charCounts.length).toBe(2)
  })

  it('should apply pipeline transformation to input text', () => {
    render(<TransformerPreview pipeline={mockPipeline} />)

    // With our mock, the output should be uppercase version of sample text
    // Text appears in both input (original) and output (transformed)
    const elements = screen.getAllByText(/HELLO WORLD/)
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should handle empty input', async () => {
    const user = userEvent.setup()
    render(<TransformerPreview pipeline={emptyPipeline} />)

    const textarea = screen.getByPlaceholderText('Paste text here to test...')

    await user.clear(textarea)

    // Should show 0 chars for input (there are two char counts - input and output)
    const charCounts = screen.getAllByText(/\d+ chars/)
    expect(charCounts[0]).toHaveTextContent('0 chars')
  })

  it('should update output when pipeline changes', () => {
    const { rerender } = render(<TransformerPreview pipeline={emptyPipeline} />)

    // Initially with empty pipeline (no transformation)
    // Text appears in both input and output
    const initialElements = screen.getAllByText(/Hello World/)
    expect(initialElements.length).toBeGreaterThan(0)

    // Rerender with transformation pipeline
    rerender(<TransformerPreview pipeline={mockPipeline} />)

    // Now should show transformed output (uppercase)
    const transformedElements = screen.getAllByText(/HELLO WORLD/)
    expect(transformedElements.length).toBeGreaterThan(0)
  })

  it('should allow editing input text', async () => {
    const user = userEvent.setup()
    render(<TransformerPreview pipeline={emptyPipeline} />)

    const textarea = screen.getByPlaceholderText('Paste text here to test...')

    expect(textarea).not.toBeDisabled()

    await user.clear(textarea)
    await user.type(textarea, 'new text')

    expect(textarea).toHaveValue('new text')
  })

  it('should have proper accessibility labels', () => {
    render(<TransformerPreview pipeline={emptyPipeline} />)

    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
  })
})
