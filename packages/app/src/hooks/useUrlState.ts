import { useState, useEffect, useCallback, useRef } from 'react'
import { getFirstHeading } from '@/utils/markdown'
import { extractFirstEmoji } from '@/utils/emoji'
import {
  compressDocumentToHash,
  decompressDocumentFromHash,
  type DocumentData,
} from '@/utils/compression'
import { generateShareableUrl, parsePathMetadata } from '@/utils/urlShare'

interface UseUrlStateOptions {
  debounceMs?: number
  maxLength?: number
  onError?: (error: Error) => void
  onLengthWarning?: (length: number, limit: number) => void
  defaultContent?: string
  defaultName?: string
}

interface UseUrlStateReturn {
  content: string
  setContent: (content: string) => void
  documentName: string
  setDocumentName: (name: string) => void
  isOverLimit: boolean
}

interface FaviconState {
  element: HTMLLinkElement
  href: string
  type: string
  sizes: string
}

/**
 * Updates the favicon based on the provided emoji.
 * If an emoji is provided, it creates an SVG data URI.
 * If null, it reverts to the default favicon.
 *
 * @param emoji - The emoji to use as favicon, or null to reset
 * @param originalFaviconsRef - Ref to store/retrieve original favicon states
 * @returns void
 */
function updateFavicon(
  emoji: string | null,
  originalFaviconsRef: React.MutableRefObject<FaviconState[] | null>
): void {
  const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']")

  // Store original state if not already stored
  if (!originalFaviconsRef.current && links.length > 0) {
    originalFaviconsRef.current = Array.from(links).map((link) => ({
      element: link,
      href: link.href,
      type: link.type,
      sizes: link.sizes.value,
    }))
  }

  if (emoji) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `.trim()
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`

    links.forEach((link) => {
      link.href = dataUri
      link.type = 'image/svg+xml'
      // Remove sizes as SVG is vector and valid for all sizes
      link.removeAttribute('sizes')
    })
  } else {
    // Revert to default using stored state
    if (originalFaviconsRef.current) {
      originalFaviconsRef.current.forEach(({ element, href, type, sizes }) => {
        element.href = href
        element.type = type
        if (sizes) {
          element.setAttribute('sizes', sizes)
        } else {
          element.removeAttribute('sizes')
        }
      })
    } else {
      // Fallback if no state stored (e.g. no links found initially, or this is first run with null)
      // This part is less critical if we assume links exist, but good for safety
      links.forEach((link) => {
        if (link.href.startsWith('data:')) {
          link.href = '/favicon.svg'
        }
      })
    }
  }
}

/**
 * Manages document state with URL hash persistence using LZ compression
 * @param options - Configuration options for URL state management
 * @returns Object containing content, document name, setters, and limit status
 */
export function useUrlState(options?: UseUrlStateOptions): UseUrlStateReturn {
  const {
    debounceMs = 500,
    maxLength: defaultMaxLength = 32_000,
    onError,
    onLengthWarning,
    defaultContent = '',
    defaultName = 'untitled.md',
  } = options ?? {}

  // Allow overriding maxLength via URL query param for testing
  const [maxLength] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const limit = params.get('limit')
    return limit ? parseInt(limit, 10) : defaultMaxLength
  })

  const [content, setContentState] = useState<string>(() => {
    // Initialize from URL hash on mount
    const hash = window.location.hash.slice(1) // Remove leading #
    if (!hash) return defaultContent

    try {
      const docData = decompressDocumentFromHash(hash)
      if (docData === null) {
        onError?.(new Error('Failed to decompress URL hash'))
        return defaultContent
      }
      return docData.content
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'))
      return defaultContent
    }
  })

  const [documentName, setDocumentNameState] = useState<string>(() => {
    // Initialize document name from URL hash on mount
    const hash = window.location.hash.slice(1)
    if (!hash) return defaultName

    try {
      const docData = decompressDocumentFromHash(hash)
      if (docData === null) return defaultName
      return docData.name ?? defaultName
    } catch {
      return defaultName
    }
  })

  const [isOverLimit, setIsOverLimit] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  // Use refs to track the latest values to avoid stale closures
  const contentRef = useRef(content)
  const documentNameRef = useRef(documentName)
  const originalFaviconsRef = useRef<FaviconState[] | null>(null)

  // Initialize title and favicon on mount
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current) {
      const heading = getFirstHeading(content)

      if (heading) {
        const emoji = extractFirstEmoji(heading)
        updateFavicon(emoji, originalFaviconsRef)

        const title = emoji ? heading.replace(emoji, '').trim() : heading
        document.title = title || documentName
      } else {
        // Check for metadata in URL path (for shared links)
        const pathMetadata = parsePathMetadata(window.location.pathname)
        if (pathMetadata) {
          document.title = pathMetadata.title
        } else {
          document.title = documentName
        }
        updateFavicon(null, originalFaviconsRef)
      }

      initializedRef.current = true
    }
  }, [content, documentName])

  // Keep refs in sync with state
  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    documentNameRef.current = documentName
  }, [documentName])

  // Debounced URL update
  const updateUrl = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      const docData: DocumentData = {
        content: contentRef.current,
        name: documentNameRef.current,
      }

      // Update document title and favicon from first heading
      const firstHeading = getFirstHeading(contentRef.current)

      const emoji = firstHeading ? extractFirstEmoji(firstHeading) : null
      updateFavicon(emoji, originalFaviconsRef)

      // If we found an emoji, remove it from the title to avoid duplication/clutter
      // We only remove the *exact* extracted emoji string once.
      let title = firstHeading
        ? emoji
          ? firstHeading.replace(emoji, '').trim()
          : firstHeading
        : null

      // If no heading, check for metadata in URL path (for shared links)
      if (!title) {
        const pathMetadata = parsePathMetadata(window.location.pathname)
        if (pathMetadata) {
          title = pathMetadata.title
        }
      }

      document.title = title || documentNameRef.current

      const compressed = compressDocumentToHash(docData)
      const overLimit = compressed.length > maxLength

      setIsOverLimit(overLimit)

      if (overLimit) {
        onLengthWarning?.(compressed.length, maxLength)
      }

      // Update URL regardless of length (allow users to continue editing)
      // Use shareable URL format with metadata in path segments
      const shareableUrl = generateShareableUrl(
        contentRef.current,
        documentNameRef.current,
        compressed
      )

      // Preserve existing query parameters
      const currentUrl = new URL(window.location.href)
      const newUrl = new URL(shareableUrl)

      // Copy query params from current URL to new URL
      currentUrl.searchParams.forEach((value, key) => {
        if (key !== 'limit') {
          // Don't copy the limit param used for testing
          newUrl.searchParams.set(key, value)
        }
      })

      // We use replaceState to update the URL without adding a new history entry for every keystroke
      window.history.replaceState(null, '', newUrl.toString())
    }, debounceMs)
  }, [debounceMs, maxLength, onLengthWarning])

  // Handle external hash changes (e.g., back/forward navigation)
  useEffect(() => {
    const handleHashChange = (): void => {
      const hash = window.location.hash.slice(1)

      const updateStateAndTitle = (newContent: string, newName: string) => {
        setContentState(newContent)
        setDocumentNameState(newName)
        const heading = getFirstHeading(newContent)

        const emoji = heading ? extractFirstEmoji(heading) : null
        updateFavicon(emoji, originalFaviconsRef)

        // First try to use heading from content
        let title = heading ? (emoji ? heading.replace(emoji, '').trim() : heading) : null

        // If no heading, check for metadata in URL path (for shared links)
        if (!title) {
          const pathMetadata = parsePathMetadata(window.location.pathname)
          if (pathMetadata) {
            title = pathMetadata.title
          }
        }

        document.title = title || newName
      }

      if (!hash) {
        updateStateAndTitle(defaultContent, defaultName)
        return
      }

      try {
        const docData = decompressDocumentFromHash(hash)
        if (docData === null) {
          onError?.(new Error('Failed to decompress URL hash'))
          updateStateAndTitle(defaultContent, defaultName)
        } else {
          updateStateAndTitle(docData.content, docData.name ?? defaultName)
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
        updateStateAndTitle(defaultContent, defaultName)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [defaultContent, defaultName, onError])

  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent)
      updateUrl()
    },
    [updateUrl]
  )

  const setDocumentName = useCallback(
    (newName: string) => {
      setDocumentNameState(newName)
      updateUrl()
    },
    [updateUrl]
  )

  return {
    content,
    setContent,
    documentName,
    setDocumentName,
    isOverLimit,
  }
}
