import { useState, useEffect, useRef, type ReactElement } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import { getMermaidInitializeOptions, type MermaidColorMode } from '@/utils/mermaidTheme'

interface MermaidDiagramProps {
  code: string
  colorMode?: MermaidColorMode
}

let initializedColorMode: MermaidColorMode | null = null
let renderCounter = 0

/**
 * Renders a Mermaid diagram from source code.
 * Manages its own render lifecycle — shows SVG on success, falls back to
 * a styled code block on syntax errors (e.g., mid-keystroke).
 * @param props - Component props
 * @param props.code - The Mermaid diagram source code
 * @param props.colorMode - Active app color mode
 * @returns A rendered SVG diagram or a fallback code block
 */
export function MermaidDiagram({ code, colorMode = 'light' }: MermaidDiagramProps): ReactElement {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const renderDiagram = async (): Promise<void> => {
      try {
        const mermaid = (await import('mermaid')).default

        if (initializedColorMode !== colorMode) {
          mermaid.initialize(getMermaidInitializeOptions(colorMode))
          initializedColorMode = colorMode
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
  }, [code, colorMode])

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async (): Promise<void> => {
    try {
      await copyToClipboard(code)
      setCopied(true)
      toast({ description: 'Mermaid code copied to clipboard' })
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  if (svg && !error) {
    return (
      <div className="preview-mermaid-block relative my-4">
        <button
          type="button"
          className="preview-mermaid-copy-button"
          aria-label="Copy Mermaid code"
          data-copied={copied ? 'true' : undefined}
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <div
          ref={containerRef}
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    )
  }

  // Fallback: show the raw code in a styled pre/code block
  return (
    <div className="preview-mermaid-block relative my-4">
      <button
        type="button"
        className="preview-mermaid-copy-button"
        aria-label="Copy Mermaid code"
        data-copied={copied ? 'true' : undefined}
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre>
        <code className="hljs language-mermaid">{code}</code>
      </pre>
    </div>
  )
}
