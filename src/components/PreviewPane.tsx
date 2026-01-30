import 'github-markdown-css/github-markdown.css'
import { useState, type ReactElement, forwardRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface PreviewPaneProps {
  htmlContent: string
}

/**
 * Renders the HTML preview of markdown content.
 * Displays styled HTML with GitHub markdown styles and copy-to-clipboard functionality.
 */
export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(
  ({ htmlContent }, ref): ReactElement => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (): Promise<void> => {
      try {
        // Create a ClipboardItem with both HTML and plain text
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const plainText =
          new DOMParser().parseFromString(htmlContent, 'text/html').body.textContent || ''
        const textBlob = new Blob([plainText], { type: 'text/plain' })

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob,
          }),
        ])

        setCopied(true)
        toast.success('Rich text copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Failed to copy to clipboard')
      }
    }

    return (
      <div className="h-full overflow-auto">
        <div ref={ref} className="relative group markdown-body p-6 pt-0 bg-transparent h-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                className="absolute top-4 right-4 z-10 h-8 w-8 bg-muted/80 backdrop-blur hover:bg-muted border border-border opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Copy rich text</p>
            </TooltipContent>
          </Tooltip>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    )
  }
)

PreviewPane.displayName = 'PreviewPane'
