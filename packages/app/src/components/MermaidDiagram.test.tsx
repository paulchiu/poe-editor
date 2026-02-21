import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}))

interface MermaidMock {
  initialize: ReturnType<typeof vi.fn>
  render: ReturnType<typeof vi.fn>
}

const loadModule = async () => {
  vi.resetModules()

  const mermaidModule = await import('mermaid')
  const componentModule = await import('./MermaidDiagram')

  return {
    MermaidDiagram: componentModule.MermaidDiagram,
    mermaid: mermaidModule.default as unknown as MermaidMock,
  }
}

describe('MermaidDiagram', () => {
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
})
