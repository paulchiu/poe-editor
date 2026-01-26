import { useState, useEffect, useCallback, useRef } from 'react'
import {
  compressDocumentToHash,
  decompressDocumentFromHash,
  type DocumentData,
} from '../utils/compression'

interface UseUrlStateOptions {
  debounceMs?: number
  maxLength?: number
  onError?: (error: Error) => void
  onLengthWarning?: (length: number) => void
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

/**
 * Manages document state with URL hash persistence using LZ compression
 */
export function useUrlState(options?: UseUrlStateOptions): UseUrlStateReturn {
  const {
    debounceMs = 500,
    maxLength = 2000,
    onError,
    onLengthWarning,
    defaultContent = '',
    defaultName = 'untitled.md',
  } = options ?? {}

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
      const compressed = compressDocumentToHash(docData)
      const overLimit = compressed.length > maxLength

      setIsOverLimit(overLimit)

      if (overLimit) {
        onLengthWarning?.(compressed.length)
      }

      // Update URL regardless of length (allow users to continue editing)
      const newHash = compressed ? `#${compressed}` : ''
      window.history.replaceState(null, '', newHash)
    }, debounceMs)
  }, [debounceMs, maxLength, onLengthWarning])

  // Handle external hash changes (e.g., back/forward navigation)
  useEffect(() => {
    const handleHashChange = (): void => {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setContentState(defaultContent)
        setDocumentNameState(defaultName)
        return
      }

      try {
        const docData = decompressDocumentFromHash(hash)
        if (docData === null) {
          onError?.(new Error('Failed to decompress URL hash'))
          setContentState(defaultContent)
          setDocumentNameState(defaultName)
        } else {
          setContentState(docData.content)
          setDocumentNameState(docData.name ?? defaultName)
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
        setContentState(defaultContent)
        setDocumentNameState(defaultName)
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
