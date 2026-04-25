import 'github-markdown-css/github-markdown.css'
import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  type ReactElement,
  type Ref,
} from 'react'
import { ArrowUpToLine, Copy, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/useToast'
import { copyToClipboard, stripHtml } from '@/utils/clipboard'
import { splitHtmlAtMermaid, type HtmlSegment } from '@/utils/splitHtmlAtMermaid'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import type { MermaidColorMode } from '@/utils/mermaidTheme'
import type { TocHeading } from '@/utils/markdown'

interface PreviewPaneProps {
  htmlContent: string
  onTaskListToggle?: (taskIndex: number, checked: boolean) => void
  onFrontMatterBooleanToggle?: (key: string, checked: boolean) => void
  viewMode?: 'editor' | 'preview' | 'split'
  onToggleLayout?: () => void
  colorMode?: MermaidColorMode
  printFriendly?: boolean
  bodyClassName?: string
  tocHeadings?: TocHeading[]
  showTocPanel?: boolean
  ref?: Ref<HTMLDivElement>
}

const CLIPBOARD_FAILURE_HINT =
  'Copy failed. Clipboard access may be blocked by your browser permissions.'
const JUMP_TO_TOP_VISIBILITY_THRESHOLD = 320
const SCROLLABLE_OVERFLOW_TOLERANCE = 8
const SEGMENT_HASH_INITIAL_VALUE = 0
const SEGMENT_HASH_MULTIPLIER = 31

interface PreviewSegmentRenderItem {
  key: string
  segment: HtmlSegment
}

const getStableSegmentKey = (segment: HtmlSegment): string => {
  const source = segment.type === 'html' ? segment.content : segment.code
  let hash = SEGMENT_HASH_INITIAL_VALUE

  for (let i = 0; i < source.length; i += 1) {
    hash = Math.imul(hash, SEGMENT_HASH_MULTIPLIER) + source.charCodeAt(i)
  }

  return `${segment.type}-${source.length}-${hash >>> 0}`
}

const getPreviewSegmentRenderItems = (htmlContent: string): PreviewSegmentRenderItem[] => {
  const seenKeys = new Map<string, number>()

  return splitHtmlAtMermaid(htmlContent).map((segment) => {
    const baseKey = getStableSegmentKey(segment)
    const occurrenceCount = seenKeys.get(baseKey) ?? 0
    seenKeys.set(baseKey, occurrenceCount + 1)

    return {
      key: occurrenceCount === 0 ? baseKey : `${baseKey}-${occurrenceCount}`,
      segment,
    }
  })
}

/**
 * Renders the HTML preview of markdown content.
 * Displays styled HTML with GitHub markdown styles and copy-to-clipboard functionality.
 * @param props - Preview pane props.
 * @returns Preview pane content.
 */
export function PreviewPane({
  htmlContent,
  onTaskListToggle,
  onFrontMatterBooleanToggle,
  viewMode,
  onToggleLayout,
  colorMode = 'light',
  printFriendly = false,
  bodyClassName = 'markdown-body',
  tocHeadings = [],
  showTocPanel = false,
  ref,
}: PreviewPaneProps): ReactElement {
  const [copied, setCopied] = useState(false)
  const [showJumpToTop, setShowJumpToTop] = useState(false)
  const previewScrollContainerRef = useRef<HTMLDivElement | null>(null)
  const previewBodyRef = useRef<HTMLDivElement>(null)

  const segments = useMemo(() => getPreviewSegmentRenderItems(htmlContent), [htmlContent])

  const setPreviewScrollContainerRef = useCallback(
    (node: HTMLDivElement | null): void => {
      previewScrollContainerRef.current = node

      if (typeof ref === 'function') {
        ref(node)
        return
      }

      if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  const updateJumpToTopVisibility = useCallback((): void => {
    const container = previewScrollContainerRef.current
    if (!container) {
      setShowJumpToTop(false)
      return
    }

    const hasScrollableContent =
      container.scrollHeight - container.clientHeight > SCROLLABLE_OVERFLOW_TOLERANCE
    setShowJumpToTop(hasScrollableContent && container.scrollTop > JUMP_TO_TOP_VISIBILITY_THRESHOLD)
  }, [])

  useEffect(() => {
    if (printFriendly) return

    const container = previewScrollContainerRef.current
    if (!container) return

    const animationFrameId = window.requestAnimationFrame(updateJumpToTopVisibility)

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateJumpToTopVisibility)

    resizeObserver?.observe(container)
    if (previewBodyRef.current) {
      resizeObserver?.observe(previewBodyRef.current)
    }

    container.addEventListener('scroll', updateJumpToTopVisibility, { passive: true })
    window.addEventListener('resize', updateJumpToTopVisibility)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver?.disconnect()
      container.removeEventListener('scroll', updateJumpToTopVisibility)
      window.removeEventListener('resize', updateJumpToTopVisibility)
    }
  }, [htmlContent, printFriendly, updateJumpToTopVisibility])

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

      const taskCheckbox = target.closest<HTMLInputElement>('input.task-list-item-checkbox')
      if (taskCheckbox && root.contains(taskCheckbox) && onTaskListToggle) {
        event.preventDefault()
        event.stopPropagation()

        const taskIndexText = taskCheckbox.getAttribute('data-task-index')
        if (!taskIndexText) return

        const taskIndex = Number.parseInt(taskIndexText, 10)
        if (Number.isNaN(taskIndex)) return

        const currentlyChecked = taskCheckbox.hasAttribute('checked')
        onTaskListToggle(taskIndex, !currentlyChecked)
        return
      }

      const frontMatterCheckbox = target.closest<HTMLInputElement>(
        '.front-matter-properties input.front-matter-boolean-input'
      )
      if (frontMatterCheckbox && root.contains(frontMatterCheckbox) && onFrontMatterBooleanToggle) {
        event.preventDefault()
        event.stopPropagation()

        const key = frontMatterCheckbox.getAttribute('data-front-matter-key')
        if (!key) return

        const currentlyChecked = frontMatterCheckbox.hasAttribute('checked')
        onFrontMatterBooleanToggle(key, !currentlyChecked)
        return
      }

      const hashLink = target.closest<HTMLAnchorElement>('a[href^="#"]')
      if (hashLink && root.contains(hashLink)) {
        const targetId = decodeURIComponent(hashLink.hash.slice(1))
        if (targetId) {
          const anchorTarget = document.getElementById(targetId)
          if (anchorTarget && root.contains(anchorTarget)) {
            event.preventDefault()
            event.stopPropagation()
            anchorTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
          }
        }
      }

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
  }, [htmlContent, onTaskListToggle, onFrontMatterBooleanToggle, printFriendly])

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

  const handleJumpToTop = (): void => {
    const container = previewScrollContainerRef.current
    if (!container) return

    container.scrollTo({ top: 0, behavior: 'smooth' })
    setShowJumpToTop(false)
  }

  return (
    <div className="relative h-full">
      <div
        ref={setPreviewScrollContainerRef}
        className="h-full overflow-auto"
        role="region"
        aria-label="Preview document"
      >
        <div
          ref={previewBodyRef}
          className={`relative group ${bodyClassName} p-6 pt-0 bg-transparent min-h-full`}
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

          {showTocPanel && tocHeadings.length > 0 && (
            <nav
              className="mb-6 rounded-md border border-border/60 bg-muted/20 p-4"
              aria-label="Table of contents"
            >
              <p className="mb-2 text-sm font-semibold">Table of Contents</p>
              <ul className="space-y-1 text-sm">
                {tocHeadings.map((heading) => (
                  <li key={heading.id} style={{ marginLeft: `${(heading.level - 1) * 0.75}rem` }}>
                    <a href={`#${heading.id}`} className="text-primary hover:underline">
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {segments.map(({ key, segment }) =>
            segment.type === 'html' ? (
              <div key={key} dangerouslySetInnerHTML={{ __html: segment.content }} />
            ) : (
              <MermaidDiagram
                key={key}
                code={segment.code}
                colorMode={colorMode}
                interactive={!printFriendly}
              />
            )
          )}
        </div>
      </div>

      {!printFriendly && showJumpToTop && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Jump to top of preview"
                onClick={handleJumpToTop}
                className="pointer-events-auto h-9 w-9 rounded-full border border-border/70 bg-background/90 text-foreground shadow-lg shadow-black/10 backdrop-blur hover:bg-muted dark:shadow-black/40"
              >
                <ArrowUpToLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Jump to top</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
