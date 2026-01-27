'use client'

import * as React from 'react'

interface SplashScreenProps {
  onComplete: () => void
  isLoading: boolean
}

export function SplashScreen({ onComplete, isLoading }: SplashScreenProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [isFading, setIsFading] = React.useState(false)

  React.useEffect(() => {
    // Start fade out when loading is complete
    if (!isLoading && isVisible) {
      const fadeTimer = setTimeout(() => {
        setIsFading(true)
      }, 300) // Brief delay before starting fade

      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, 800) // Duration of fade animation + delay

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [isLoading, isVisible, onComplete])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-background via-background to-primary/5 transition-opacity duration-500',
        isFading ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-3xl" />
            <div className="relative h-20 w-20 rounded-full bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">Poe</span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Poe Markdown Editor
        </h1>
        <p className="mt-3 text-base text-muted-foreground">Loading your editor...</p>
        <div className="mt-6 flex justify-center gap-1">
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
