import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { PoeEditor } from "@/components/poe-editor"
import { SplashScreen } from "@/components/splash-screen"

const SPLASH_SESSION_KEY = 'poe-splash-shown'

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

  React.useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, 'true')
    setHasShownSplash(true)
  }

  // Don't show splash on subsequent visits in same session
  const showSplash = !hasShownSplash && mounted

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} isLoading={isLoading} />
      )}
      <PoeEditor />
    </ThemeProvider>
  )
}
