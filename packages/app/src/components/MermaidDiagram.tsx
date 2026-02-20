import { useState, useEffect, useRef, type ReactElement } from 'react'

interface MermaidDiagramProps {
  code: string
}

let mermaidInitialized = false
let renderCounter = 0

/**
 * Renders a Mermaid diagram from source code.
 * Manages its own render lifecycle — shows SVG on success, falls back to
 * a styled code block on syntax errors (e.g., mid-keystroke).
 * @param props - Component props
 * @param props.code - The Mermaid diagram source code
 * @returns A rendered SVG diagram or a fallback code block
 */
export function MermaidDiagram({ code }: MermaidDiagramProps): ReactElement {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const renderDiagram = async (): Promise<void> => {
      try {
        const mermaid = (await import('mermaid')).default

        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: 'default' })
          mermaidInitialized = true
        }

        const id = `mermaid-diagram-${++renderCounter}`
        const { svg: rendered } = await mermaid.render(id, code)

        if (!cancelled) {
          setSvg(rendered)
          setError(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [code])

  if (svg && !error) {
    return (
      <div
        ref={containerRef}
        className="flex justify-center my-4"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  // Fallback: show the raw code in a styled pre/code block
  return (
    <pre>
      <code className="hljs language-mermaid">{code}</code>
    </pre>
  )
}
