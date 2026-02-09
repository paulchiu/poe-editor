import 'github-markdown-css/github-markdown.css'
import { useState, type ReactElement, forwardRef } from 'react'
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { copyToClipboard, stripHtml } from '@/utils/clipboard'

interface PreviewPaneProps {
  htmlContent: string
  viewMode?: 'editor' | 'preview' | 'split'
  onToggleLayout?: () => void
}

/**
 * Renders the HTML preview of markdown content.
 * Displays styled HTML with GitHub markdown styles and copy-to-clipboard functionality.
 */
export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(
  ({ htmlContent, viewMode, onToggleLayout }, ref): ReactElement => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (): Promise<void> => {
      try {
        const plainText = stripHtml(htmlContent)
        await copyToClipboard(plainText, htmlContent)

        setCopied(true)
        toast.success('Rich text copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Failed to copy to clipboard')
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

          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    )
  }
)

PreviewPane.displayName = 'PreviewPane'
