import { useEffect, useRef, useCallback, type RefObject } from 'react'

interface UseSyncScrollOptions {
  enabled?: boolean
  debounceMs?: number
}

interface UseSyncScrollReturn<T extends HTMLElement = HTMLElement> {
  sourceRef: RefObject<T | null>
  targetRef: RefObject<T | null>
}

/**
 * Synchronizes scroll position between two elements.
 * Maintains scroll percentage ratio to work with elements of different heights.
 * @param options - Configuration object with optional enabled flag and debounce duration
 * @returns Refs for source and target elements to synchronize
 */
export function useSyncScroll<T extends HTMLElement = HTMLElement>(
  options: UseSyncScrollOptions = {}
): UseSyncScrollReturn<T> {
  const { enabled = true, debounceMs = 50 } = options

  const sourceRef = useRef<T | null>(null)
  const targetRef = useRef<T | null>(null)
  const isScrollingSource = useRef(false)
  const isScrollingTarget = useRef(false)
  const scrollTimeoutSource = useRef<number | undefined>(undefined)
  const scrollTimeoutTarget = useRef<number | undefined>(undefined)

  const syncScroll = useCallback(
    (from: 'source' | 'target') => {
      if (!enabled) return

      const source = from === 'source' ? sourceRef.current : targetRef.current
      const target = from === 'source' ? targetRef.current : sourceRef.current

      if (!source || !target) return

      const scrollTop = source.scrollTop
      const scrollHeight = source.scrollHeight
      const clientHeight = source.clientHeight

      // Calculate scroll percentage
      const maxScroll = scrollHeight - clientHeight
      if (maxScroll <= 0) return

      const scrollPercentage = scrollTop / maxScroll

      // Apply to target
      const targetMaxScroll = target.scrollHeight - target.clientHeight
      if (targetMaxScroll <= 0) return

      const targetScrollTop = scrollPercentage * targetMaxScroll

      // Set flag to prevent infinite loop
      if (from === 'source') {
        isScrollingSource.current = true
      } else {
        isScrollingTarget.current = true
      }

      target.scrollTop = targetScrollTop

      // Clear flag after a short delay
      setTimeout(() => {
        if (from === 'source') {
          isScrollingSource.current = false
        } else {
          isScrollingTarget.current = false
        }
      }, 100)
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    let cleanupFn: (() => void) | undefined
    let pollInterval: number | undefined

    const attachListeners = (): boolean => {
      const source = sourceRef.current
      const target = targetRef.current

      if (!source || !target) return false

      const handleSourceScroll = (): void => {
        if (isScrollingSource.current) return

        if (scrollTimeoutSource.current) {
          clearTimeout(scrollTimeoutSource.current)
        }

        scrollTimeoutSource.current = window.setTimeout(() => {
          syncScroll('source')
        }, debounceMs)
      }

      const handleTargetScroll = (): void => {
        if (isScrollingTarget.current) return

        if (scrollTimeoutTarget.current) {
          clearTimeout(scrollTimeoutTarget.current)
        }

        scrollTimeoutTarget.current = window.setTimeout(() => {
          syncScroll('target')
        }, debounceMs)
      }

      source.addEventListener('scroll', handleSourceScroll)
      target.addEventListener('scroll', handleTargetScroll)

      cleanupFn = () => {
        source.removeEventListener('scroll', handleSourceScroll)
        target.removeEventListener('scroll', handleTargetScroll)

        if (scrollTimeoutSource.current) {
          clearTimeout(scrollTimeoutSource.current)
        }
        if (scrollTimeoutTarget.current) {
          clearTimeout(scrollTimeoutTarget.current)
        }
      }

      return true
    }

    // Try to attach immediately
    if (!attachListeners()) {
      // If refs are not ready, poll until they are
      pollInterval = window.setInterval(() => {
        if (attachListeners()) {
          window.clearInterval(pollInterval)
        }
      }, 100)
    }

    return () => {
      if (cleanupFn) cleanupFn()
      if (pollInterval) window.clearInterval(pollInterval)
    }
  }, [enabled, debounceMs, syncScroll])

  return {
    sourceRef,
    targetRef,
  }
}
