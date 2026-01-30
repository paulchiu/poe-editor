import { useState, useCallback, lazy, Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { SplashScreen } from '@/components/SplashScreen'
import { Toaster } from '@/components/ui/toaster'

// Lazy load the main editor component
const PoeEditor = lazy(() =>
  import('@/components/PoeEditor').then((module) => ({
    default: module.PoeEditor,
  }))
)

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  const handleEditorReady = useCallback(() => {
    // Editor is fully loaded and ready
    setIsLoading(false)
  }, [])

  const handleSplashComplete = useCallback(() => {
    // Splash animation completed
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {isLoading && <SplashScreen onComplete={handleSplashComplete} isLoading={isLoading} />}
      <Suspense fallback={null}>
        <PoeEditor onReady={handleEditorReady} />
      </Suspense>
      <Toaster />
    </ThemeProvider>
  )
}
