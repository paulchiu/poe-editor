import 'github-markdown-css/github-markdown.css'
import { useEffect, useState, useMemo, useRef, type ReactElement, forwardRef } from 'react'
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
  printFriendly?: boolean
  bodyClassName?: string
}

const CLIPBOARD_FAILURE_HINT =
  'Copy failed. Clipboard access may be blocked by your browser permissions.'

/**
 * Renders the HTML preview of markdown content.
 * Displays styled HTML with GitHub markdown styles and copy-to-clipboard functionality.
 */
export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(
  (
    {
      htmlContent,
      viewMode,
      onToggleLayout,
      colorMode = 'light',
      printFriendly = false,
      bodyClassName = 'markdown-body',
    },
    ref
  ): ReactElement => {
    const [copied, setCopied] = useState(false)
    const previewBodyRef = useRef<HTMLDivElement>(null)

    const segments = useMemo(() => splitHtmlAtMermaid(htmlContent), [htmlContent])

    useEffect(() => {
      if (printFriendly) return

      const root = previewBodyRef.current
      if (!root) return

      const copyResetTimeouts = new Map<HTMLButtonElement, number>()

      const findCodeHosts = (): HTMLElement[] => {
        const codeElements = Array.from(root.querySelectorAll<HTMLElement>('pre > code'))
        const processedHosts = new Set<HTMLElement>()
        const hosts: HTMLElement[] = []

        for (const codeElement of codeElements) {
          if (
            codeElement.classList.contains('language-mermaid') ||
            codeElement.closest('.preview-mermaid-block')
          ) {
            continue
          }

          const preElement = codeElement.closest('pre')
          if (!preElement) continue

          const wrappedBlock = preElement.closest<HTMLElement>(
            '.code-block-with-language:not([data-language="mermaid"])'
          )
          const host = wrappedBlock ?? preElement

          if (processedHosts.has(host)) continue
          processedHosts.add(host)
          hosts.push(host)
        }

        return hosts
      }

      const ensureCodeCopyButtons = (): void => {
        const hosts = findCodeHosts()
        for (const host of hosts) {
          host.classList.add('preview-code-copy-host')

          const existingButton = Array.from(host.children).find((child) =>
            child.classList.contains('preview-code-copy-button')
          )
          if (existingButton) continue

          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'preview-code-copy-button'
          button.setAttribute('aria-label', 'Copy code block')

          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          icon.setAttribute('viewBox', '0 0 24 24')
          icon.setAttribute('aria-hidden', 'true')
          icon.classList.add('preview-code-copy-icon')

          const frontSheet = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          frontSheet.setAttribute('x', '9')
          frontSheet.setAttribute('y', '9')
          frontSheet.setAttribute('width', '11')
          frontSheet.setAttribute('height', '11')
          frontSheet.setAttribute('rx', '2')
          frontSheet.setAttribute('ry', '2')

          const backSheet = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          backSheet.setAttribute('d', 'M6 15c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2')
          icon.append(frontSheet, backSheet)

          const label = document.createElement('span')
          label.className = 'preview-code-copy-label'
          label.textContent = 'Copy'

          button.append(icon, label)
          host.append(button)
        }
      }

      const handleCopyButtonClick = async (event: Event): Promise<void> => {
        const target = event.target
        if (!(target instanceof Element)) return

        const button = target.closest<HTMLButtonElement>('.preview-code-copy-button')
        if (!button || !root.contains(button)) return

        event.preventDefault()
        event.stopPropagation()

        const host = button.parentElement
        if (!(host instanceof HTMLElement)) return

        const codeElement = host.matches('pre')
          ? host.querySelector('code')
          : host.querySelector('pre > code')
        const currentCode = codeElement?.textContent ?? ''
        const code = currentCode.replace(/\n$/, '')
        if (!code) return

        try {
          await copyToClipboard(code)
          const label = button.querySelector<HTMLElement>('.preview-code-copy-label')
          if (label) label.textContent = 'Copied'
          button.setAttribute('data-copied', 'true')
          toast({ description: 'Code copied to clipboard' })

          const previousTimeoutId = copyResetTimeouts.get(button)
          if (previousTimeoutId !== undefined) {
            window.clearTimeout(previousTimeoutId)
          }

          const timeoutId = window.setTimeout(() => {
            if (!button.isConnected) return
            const resetLabel = button.querySelector<HTMLElement>('.preview-code-copy-label')
            if (resetLabel) resetLabel.textContent = 'Copy'
            button.removeAttribute('data-copied')
            copyResetTimeouts.delete(button)
          }, 2000)
          copyResetTimeouts.set(button, timeoutId)
        } catch {
          toast({
            description: CLIPBOARD_FAILURE_HINT,
            variant: 'destructive',
          })
        }
      }

      ensureCodeCopyButtons()
      const observer = new MutationObserver(() => {
        ensureCodeCopyButtons()
      })
      observer.observe(root, { childList: true, subtree: true })
      root.addEventListener('click', handleCopyButtonClick)

      return () => {
        observer.disconnect()
        root.removeEventListener('click', handleCopyButtonClick)
        for (const timeoutId of copyResetTimeouts.values()) {
          window.clearTimeout(timeoutId)
        }

        const buttons = Array.from(
          root.querySelectorAll<HTMLButtonElement>('.preview-code-copy-button')
        )
        for (const button of buttons) {
          button.remove()
        }
        const hosts = Array.from(root.querySelectorAll<HTMLElement>('.preview-code-copy-host'))
        for (const host of hosts) {
          host.classList.remove('preview-code-copy-host')
        }
      }
    }, [htmlContent, printFriendly])

    const handleCopy = async (): Promise<void> => {
      try {
        const plainText = stripHtml(htmlContent)
        await copyToClipboard(plainText, htmlContent)

        setCopied(true)
        toast({ description: 'Rich text copied to clipboard' })
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast({
          description: CLIPBOARD_FAILURE_HINT,
          variant: 'destructive',
        })
      }
    }

    return (
      <div ref={ref} className="h-full overflow-auto">
        <div
          ref={previewBodyRef}
          className={`relative group ${bodyClassName} p-6 pt-0 bg-transparent h-full`}
        >
          {!printFriendly && (
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
          )}

          {segments.map((segment, i) =>
            segment.type === 'html' ? (
              <div key={i} dangerouslySetInnerHTML={{ __html: segment.content }} />
            ) : (
              <MermaidDiagram
                key={i}
                code={segment.code}
                colorMode={colorMode}
                interactive={!printFriendly}
              />
            )
          )}
        </div>
      </div>
    )
  }
)

PreviewPane.displayName = 'PreviewPane'
