import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}))

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}))

interface MermaidMock {
  initialize: ReturnType<typeof vi.fn>
  render: ReturnType<typeof vi.fn>
}

const loadModule = async () => {
  vi.resetModules()

  const mermaidModule = await import('mermaid')
  const clipboardModule = await import('@/utils/clipboard')
  const toastModule = await import('@/hooks/useToast')
  const componentModule = await import('./MermaidDiagram')

  return {
    MermaidDiagram: componentModule.MermaidDiagram,
    mermaid: mermaidModule.default as unknown as MermaidMock,
    copyToClipboard: clipboardModule.copyToClipboard as ReturnType<typeof vi.fn>,
    toast: toastModule.toast as ReturnType<typeof vi.fn>,
  }
}

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders svg output when mermaid rendering succeeds', async () => {
    const { MermaidDiagram, mermaid } = await loadModule()
    mermaid.render.mockResolvedValue({
      svg: '<svg><text>diagram</text></svg>',
    })

    const { container } = render(<MermaidDiagram code="graph TD;A-->B" colorMode="light" />)

    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull()
    })

    expect(mermaid.initialize).toHaveBeenCalledTimes(1)
    expect(mermaid.render).toHaveBeenCalledTimes(1)
  })

  it('falls back to raw code when mermaid rendering fails', async () => {
    const { MermaidDiagram, mermaid } = await loadModule()
    mermaid.render.mockRejectedValue(new Error('render failed'))

    render(<MermaidDiagram code="graph TD;A-->B" colorMode="light" />)

    await waitFor(() => {
      expect(screen.getByText('graph TD;A-->B')).toBeInTheDocument()
    })
  })

  it('re-initializes only when color mode changes', async () => {
    const { MermaidDiagram, mermaid } = await loadModule()
    mermaid.render.mockResolvedValue({
      svg: '<svg><text>diagram</text></svg>',
    })

    const { rerender, container } = render(
      <MermaidDiagram code="graph TD;A-->B" colorMode="light" />
    )

    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull()
    })

    const initialInitializeCalls = mermaid.initialize.mock.calls.length

    rerender(<MermaidDiagram code="graph TD;B-->C" colorMode="light" />)

    await waitFor(() => {
      expect(mermaid.render.mock.calls.length).toBeGreaterThan(1)
    })
    expect(mermaid.initialize.mock.calls.length).toBe(initialInitializeCalls)

    rerender(<MermaidDiagram code="graph TD;C-->D" colorMode="dark" />)

    await waitFor(() => {
      expect(mermaid.initialize.mock.calls.length).toBeGreaterThan(initialInitializeCalls)
    })
  })

  it('copies mermaid source from copy button', async () => {
    const { MermaidDiagram, mermaid, copyToClipboard, toast } = await loadModule()
    mermaid.render.mockResolvedValue({
      svg: '<svg><text>diagram</text></svg>',
    })

    render(<MermaidDiagram code="graph TD;A-->B" colorMode="light" />)

    const copyButton = screen.getByRole('button', { name: 'Copy Mermaid code' })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('graph TD;A-->B')
      expect(toast).toHaveBeenCalledWith({ description: 'Mermaid code copied to clipboard' })
    })
  })

  it('shows error toast when mermaid copy fails', async () => {
    const { MermaidDiagram, mermaid, copyToClipboard, toast } = await loadModule()
    mermaid.render.mockResolvedValue({
      svg: '<svg><text>diagram</text></svg>',
    })
    copyToClipboard.mockRejectedValueOnce(new Error('copy failed'))

    render(<MermaidDiagram code="graph TD;A-->B" colorMode="light" />)

    const copyButton = screen.getByRole('button', { name: 'Copy Mermaid code' })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    })
  })
})
