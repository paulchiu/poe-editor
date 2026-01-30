import { useEffect, useState, type ReactElement } from 'react'
import { cn } from '@/utils/classnames'

interface SplashScreenProps {
  onComplete: () => void
  isLoading: boolean
  debug?: boolean
}

/**
 * Splash screen component that displays a hero image and transitions to the main app.
 *
 * @param props - The component props.
 * @param props.onComplete - Callback function triggered when the splash animation completes.
 * @param props.isLoading - Boolean indicating if the application is still loading resources.
 * @returns The rendered splash screen or null if not visible.
 */
export function SplashScreen({ onComplete, isLoading, debug = false }: SplashScreenProps): ReactElement | null {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Start fade out when loading is complete
    if (!isLoading && isVisible && !debug) {
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
  }, [isLoading, isVisible, onComplete, debug])

  useEffect(() => {
    if (debug && isVisible) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFading(true)
          setTimeout(() => {
            setIsVisible(false)
            onComplete()
          }, 500)
        }
      }
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [debug, isVisible, onComplete])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500',
        isFading ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="flex w-full max-w-4xl gap-12 px-8">
        {/* Hero Image Section */}
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-2xl blur-3xl" />
            <img
              src="/splash-hero.png"
              alt="Poe - Markdown Editor"
              width={280}
              height={280}
              className="relative h-auto w-72 max-w-full"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Poe
          </h1>
          <p className="mt-2 text-2xl font-light text-muted-foreground">
            Markdown Editor
          </p>

          <div className="mt-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              A distraction-free writing experience
            </p>
          </div>

          {/* Loading Indicator */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              {isLoading && <div className="h-full w-1/3 animate-pulse bg-primary" />}
              {!isLoading && debug && <div className="h-full w-full bg-primary" />}
            </div>
            <span className="text-xs text-muted-foreground">{isLoading ? 'Loading' : 'Ready'}</span>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 Paul Chiu. All rights reserved.
            </p>
            {debug && (
              <p className="mt-2 text-xs font-medium text-yellow-500">
                Debug Mode: Press Esc to exit
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
