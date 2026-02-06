import { useEffect, useRef, useCallback, type RefObject } from 'react'

interface ScrollableElement {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

interface ScrollableHandle {
  getScrollTop: () => number
  setScrollTop: (v: number) => void
  getScrollHeight: () => number
  getClientHeight: () => number
  onScroll: (cb: () => void) => { dispose: () => void }
}

interface UseSyncScrollOptions {
  enabled?: boolean
}

type Scrollable = HTMLElement | ScrollableHandle

/**
 * Synchronizes scroll position between two elements.
 * Maintains scroll percentage ratio to work with elements of different heights.
 * Supports both DOM elements and imperative handles with scroll methods.
 *
 * @param options - Configuration object with optional enabled flag
 * @param options.enabled - Whether scroll synchronization is active (default: true)
 * @returns Object containing refs for source and target scrollable elements
 * @returns sourceRef - Ref to assign to the source scrollable element
 * @returns targetRef - Ref to assign to the target scrollable element
 */
export function useSyncScroll<S extends Scrollable = Scrollable, T extends Scrollable = Scrollable>(
  options: UseSyncScrollOptions = {}
): { sourceRef: RefObject<S | null>; targetRef: RefObject<T | null> } {
  const { enabled = true } = options

  const sourceRef = useRef<S | null>(null)
  const targetRef = useRef<T | null>(null)
  const isScrollingSource = useRef(false)
  const isScrollingTarget = useRef(false)

  // Type guard to check if element is a scrollable handle
  const isScrollableHandle = useCallback(
    (el: Scrollable): el is ScrollableHandle =>
      'getScrollTop' in el && typeof el.getScrollTop === 'function',
    []
  )

  // Helper to normalize scroll access
  const getScroll = useCallback(
    (el: Scrollable): ScrollableElement =>
      isScrollableHandle(el)
        ? {
            scrollTop: el.getScrollTop(),
            scrollHeight: el.getScrollHeight(),
            clientHeight: el.getClientHeight(),
          }
        : {
            scrollTop: el.scrollTop,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
          },
    [isScrollableHandle]
  )

  // Helper to normalize scroll setting
  const setScroll = useCallback(
    (el: Scrollable, value: number): void => {
      if (isScrollableHandle(el)) {
        el.setScrollTop(value)
      } else {
        el.scrollTop = value
      }
    },
    [isScrollableHandle]
  )

  const syncScroll = useCallback(
    (from: 'source' | 'target') => {
      if (!enabled) return

      const source = from === 'source' ? sourceRef.current : targetRef.current
      const target = from === 'source' ? targetRef.current : sourceRef.current

      if (!source || !target) return

      // Use mutex to prevent infinite loop
      if (from === 'source' && isScrollingSource.current) return
      if (from === 'target' && isScrollingTarget.current) return

      const { scrollTop, scrollHeight, clientHeight } = getScroll(source)

      // Calculate scroll percentage
      const maxScroll = scrollHeight - clientHeight
      if (maxScroll <= 0) return

      const scrollPercentage = scrollTop / maxScroll

      // Apply to target
      const targetState = getScroll(target)
      const targetMaxScroll = targetState.scrollHeight - targetState.clientHeight
      if (targetMaxScroll <= 0) return

      const targetScrollTop = scrollPercentage * targetMaxScroll

      // DELTA CHECK: If the change is insignificant, don't apply it.
      // This is the most reliable way to break infinite loops.
      if (Math.abs(targetState.scrollTop - targetScrollTop) < 2) return

      // Lock the SOURCE of this event (to prevent it from reacting to the echo)
      // Actually, standard pattern is: I am scrolling 'source', so I will update 'target'.
      // When 'target' updates, it will fire an event. I want 'target' to IGNORE that event.
      // So I should lock 'target'.
      if (from === 'source') {
        isScrollingTarget.current = true
      } else {
        isScrollingSource.current = true
      }

      setScroll(target, targetScrollTop)

      // Unlock after a short delay to allow the event to propagate and be ignored
      setTimeout(() => {
        if (from === 'source') {
          isScrollingTarget.current = false
        } else {
          isScrollingSource.current = false
        }
      }, 50)
    },
    [enabled, getScroll, setScroll]
  )

  useEffect(() => {
    if (!enabled) return

    const source = sourceRef.current
    const target = targetRef.current

    if (!source || !target) return

    // Helper to attach listener
    const attach = (el: Scrollable, callback: () => void): (() => void) => {
      if (isScrollableHandle(el)) {
        return el.onScroll(callback).dispose
      } else {
        el.addEventListener('scroll', callback)
        return () => el.removeEventListener('scroll', callback)
      }
    }

    const cleanupSource = attach(source, () => syncScroll('source'))
    const cleanupTarget = attach(target, () => syncScroll('target'))

    return () => {
      cleanupSource?.()
      cleanupTarget?.()
    }
  }, [enabled, syncScroll, isScrollableHandle])

  return {
    sourceRef,
    targetRef,
  }
}
