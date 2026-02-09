import { useSyncExternalStore } from 'react'

/**
 * Hook to listen for media query matches.
 * @param query - The media query to listen for (e.g. '(min-width: 1024px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches
  )
}
