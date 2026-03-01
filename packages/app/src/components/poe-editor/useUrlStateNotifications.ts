import { useCallback } from 'react'

interface ToastInput {
  variant?: 'default' | 'destructive'
  title?: string
  description?: string
}

interface UseUrlStateNotificationsParams {
  toast: (input: ToastInput) => unknown
}

interface UrlStateNotifications {
  handleError: (error: Error) => void
  handleLengthWarning: (length: number, limit: number) => void
}

/**
 * Creates stable URL-state notification callbacks for error and length warnings.
 * @param params - Toast dependency used for notifications.
 * @returns URL-state callbacks for `useUrlState`.
 */
export function useUrlStateNotifications({
  toast,
}: UseUrlStateNotificationsParams): UrlStateNotifications {
  const handleError = useCallback(
    (error: Error): void => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
    [toast]
  )

  const handleLengthWarning = useCallback(
    (length: number, limit: number): void => {
      const percentage = Math.round((length / limit) * 100)
      toast({
        variant: 'default',
        description: `URL limit reached, used ${percentage}%. Changes are not saved.`,
      })
    },
    [toast]
  )

  return {
    handleError,
    handleLengthWarning,
  }
}
