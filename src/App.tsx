import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { SplashScreen } from "@/components/splash-screen"
import { Toaster } from "@/components/ui/toaster"

// Lazy load the main editor component
const PoeEditor = React.lazy(() =>
  import("@/components/poe-editor").then(module => ({ default: module.PoeEditor }))
)

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true)

  const handleEditorReady = React.useCallback(() => {
    // Editor is fully loaded and ready
    setIsLoading(false)
  }, [])

  const handleSplashComplete = React.useCallback(() => {
    // Splash animation completed
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {isLoading && (
        <SplashScreen onComplete={handleSplashComplete} isLoading={isLoading} />
      )}
      <React.Suspense fallback={null}>
        <PoeEditor onReady={handleEditorReady} />
      </React.Suspense>
      <Toaster />
    </ThemeProvider>
  )
}
