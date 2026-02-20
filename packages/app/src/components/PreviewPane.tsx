import 'github-markdown-css/github-markdown.css'
import { useState, useMemo, type ReactElement, forwardRef } from 'react'
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/useToast'
import { copyToClipboard, stripHtml } from '@/utils/clipboard'
import { splitHtmlAtMermaid } from '@/utils/splitHtmlAtMermaid'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import type { MermaidColorMode } from '@/utils/mermaidTheme'

interface PreviewPaneProps {
  htmlContent: string
  viewMode?: 'editor' | 'preview' | 'split'
  onToggleLayout?: () => void
  colorMode?: MermaidColorMode
}

/**
 * Renders the HTML preview of markdown content.
 * Displays styled HTML with GitHub markdown styles and copy-to-clipboard functionality.
 */
export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(
  ({ htmlContent, viewMode, onToggleLayout, colorMode = 'light' }, ref): ReactElement => {
    const [copied, setCopied] = useState(false)

    const segments = useMemo(() => splitHtmlAtMermaid(htmlContent), [htmlContent])

    const handleCopy = async (): Promise<void> => {
      try {
        const plainText = stripHtml(htmlContent)
        await copyToClipboard(plainText, htmlContent)

        setCopied(true)
        toast({ description: 'Rich text copied to clipboard' })
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast({
          description: 'Failed to copy to clipboard',
          variant: 'destructive',
        })
      }
    }

    return (
      <div ref={ref} className="h-full overflow-auto">
        <div className="relative group markdown-body p-6 pt-0 bg-transparent h-full">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleLayout && viewMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleLayout}
                    className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border"
                  >
                    {viewMode === 'split' ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {viewMode === 'split' ? 'Expand Preview' : 'Restore Split View'}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  className="h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Copy Rich Text</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {segments.map((segment, i) =>
            segment.type === 'html' ? (
              <div key={i} dangerouslySetInnerHTML={{ __html: segment.content }} />
            ) : (
              <MermaidDiagram key={i} code={segment.code} colorMode={colorMode} />
            )
          )}
        </div>
      </div>
    )
  }
)

PreviewPane.displayName = 'PreviewPane'
