import { useEffect, useState } from 'react'
import { toast } from '@/hooks/useToast'
import {
  getBooleanEditorPreference,
  setBooleanEditorPreference,
} from '@/utils/editorPreferencesStorage'

interface UseSpellCheckReturn {
  spellCheck: boolean
  toggleSpellCheck: () => void
  setSpellCheck: (enabled: boolean) => void
}

/**
 * Manages Spell Check state with browser persistence.
 * Spell Check preference is saved to localStorage and restored on page reload.
 * @returns Current spell check state and toggle function
 */
export function useSpellCheck(): UseSpellCheckReturn {
  const [spellCheck, setSpellCheck] = useState<boolean>(() =>
    getBooleanEditorPreference('spellCheck', false)
  )

  const toggleSpellCheck = (): void => {
    setSpellCheck((current) => !current)
  }

  const updateSpellCheck = (enabled: boolean): void => {
    setSpellCheck(enabled)
  }

  useEffect(() => {
    const didPersist = setBooleanEditorPreference('spellCheck', spellCheck)
    if (!didPersist) {
      toast({
        description: 'Failed to save spell check preference to local storage',
        variant: 'destructive',
      })
    }
  }, [spellCheck])

  return {
    spellCheck,
    toggleSpellCheck,
    setSpellCheck: updateSpellCheck,
  }
}
