import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { SplashScreen } from "@/components/splash-screen"

const SPLASH_SESSION_KEY = 'poe-splash-shown'

// Lazy load the main editor component
const PoeEditor = React.lazy(() =>
  import("@/components/poe-editor").then(module => ({ default: module.PoeEditor }))
)

export default function App() {
  const [hasShownSplash, setHasShownSplash] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem(SPLASH_SESSION_KEY)
    setHasShownSplash(!!splashShown)
    setMounted(true)
  }, [])

  const handleEditorReady = React.useCallback(() => {
    // Editor is fully loaded and ready
    setIsLoading(false)
  }, [])

  const handleSplashComplete = React.useCallback(() => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, 'true')
    setHasShownSplash(true)
  }, [])

  // Don't show splash on subsequent visits in same session
  const showSplash = !hasShownSplash && mounted

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} isLoading={isLoading} />
      )}
      <React.Suspense fallback={null}>
        <PoeEditor onReady={handleEditorReady} />
      </React.Suspense>
    </ThemeProvider>
  )
}
