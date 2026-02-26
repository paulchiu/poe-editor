import { useState, useEffect, useRef, type ReactElement } from 'react'
import { Check, ChevronDown, Copy, Image } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { copySvgImageToClipboard, copyToClipboard } from '@/utils/clipboard'
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'code' | 'image'>('idle')
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const copyControlsRef = useRef<HTMLDivElement>(null)
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
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!copyControlsRef.current?.contains(target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!svg || error) {
      setMenuOpen(false)
    }
  }, [svg, error])

  const setCopiedStatus = (status: 'code' | 'image'): void => {
    setCopyStatus(status)
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current)
    }
    copyResetTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2000)
  }

  const handleCopyCode = async (): Promise<void> => {
    try {
      await copyToClipboard(code)
      setCopiedStatus('code')
      setMenuOpen(false)
      toast({ description: 'Mermaid code copied to clipboard' })
    } catch {
      toast({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleCopyImage = async (): Promise<void> => {
    if (!svg || error) {
      toast({
        description: 'Mermaid image is not available',
        variant: 'destructive',
      })
      return
    }

    try {
      await copySvgImageToClipboard(svg)
      setCopiedStatus('image')
      setMenuOpen(false)
      toast({ description: 'Mermaid image copied to clipboard' })
    } catch {
      toast({
        description: 'Failed to copy image to clipboard',
        variant: 'destructive',
      })
    }
  }

  const renderCopyControls = (canCopyImage: boolean): ReactElement => {
    if (!canCopyImage) {
      return (
        <div ref={copyControlsRef} className="preview-mermaid-copy-controls">
          <button
            type="button"
            className="preview-mermaid-copy-main-button"
            aria-label="Copy Mermaid code"
            data-copied={copyStatus === 'code' ? 'true' : undefined}
            onClick={handleCopyCode}
          >
            {copyStatus === 'code' ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copyStatus === 'code' ? 'Code copied' : 'Copy code'}</span>
          </button>
        </div>
      )
    }

    return (
      <div
        ref={copyControlsRef}
        className="preview-mermaid-copy-controls"
        data-open={menuOpen ? 'true' : undefined}
      >
        <button
          type="button"
          className="preview-mermaid-copy-main-button"
          aria-label="Copy Mermaid image"
          data-copied={copyStatus === 'image' ? 'true' : undefined}
          onClick={handleCopyImage}
        >
          {copyStatus === 'image' ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Image className="h-3.5 w-3.5" />
          )}
          <span>{copyStatus === 'image' ? 'Image copied' : 'Copy image'}</span>
        </button>
        <button
          type="button"
          className="preview-mermaid-copy-menu-button"
          aria-label="Mermaid copy options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <div className="preview-mermaid-copy-menu" role="menu" aria-label="Mermaid copy options">
            <button
              type="button"
              role="menuitem"
              className="preview-mermaid-copy-menu-item"
              onClick={handleCopyCode}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copyStatus === 'code' ? 'Code copied' : 'Copy code'}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  if (svg && !error) {
    return (
      <div className="preview-mermaid-block relative my-4">
        {renderCopyControls(true)}
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
      {renderCopyControls(false)}
      <pre>
        <code className="hljs language-mermaid">{code}</code>
      </pre>
    </div>
  )
}
