import { useState, useCallback } from 'react'

export type ViewMode = 'editor' | 'preview' | 'split'

interface UseViewModeReturn {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

/**
 * Manages the editor view mode state, synchronized with the URL query parameter 'view'.
 * @returns Object containing viewMode state and setter
 */
export function useViewMode(): UseViewModeReturn {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'split'
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    if (view === 'editor' || view === 'preview' || view === 'split') {
      return view
    }
    return 'split'
  })

  // Sync state changes to URL
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)

    const url = new URL(window.location.href)
    if (mode === 'split') {
      url.searchParams.delete('view')
    } else {
      url.searchParams.set('view', mode)
    }

    // Use replaceState to avoid cluttering history stack with view toggles if desired
    // Or pushState if back button should revert view.
    // Given the user request "toggle between preview and editor mode and persist in URL",
    // replacing state feels smoother for layout changes, but pushState is better for "navigation"
    // Let's stick with replaceState to match existing behavior of "app state" unless requested otherwise.
    window.history.replaceState(null, '', url.toString())
  }, [])

  // Listen for external URL changes (e.g. popstate) if we want to support back button navigation for view changes
  // converting this to pushState would require handling popstate here.
  // For now, simple sync on mount and manual updates.

  return {
    viewMode,
    setViewMode,
  }
}
