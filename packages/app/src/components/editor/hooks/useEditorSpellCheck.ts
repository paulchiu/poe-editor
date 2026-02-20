import { useEffect } from 'react'
import type { editor } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no type declarations available
import { getSpellchecker } from 'monaco-spellchecker'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no type declarations available
import Typo from 'typo-js'
import { onVimSpellCheckChange } from '../vim'

interface UseEditorSpellCheckParams {
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  monacoRef: React.RefObject<typeof Monaco | null>
  spellCheck: boolean
  vimMode?: boolean
  onSpellCheckChange?: (enabled: boolean) => void
  editorInstance?: editor.IStandaloneCodeEditor | null
}

/**
 * Manages spell check initialization and lifecycle for the Monaco editor.
 * Loads en_US dictionary via typo-js and integrates with monaco-spellchecker.
 * Also syncs Vim spell check state with React state.
 *
 * @param params - Editor refs, spell check state, and callbacks
 * @returns void
 */
export function useEditorSpellCheck({
  editorRef,
  monacoRef,
  spellCheck,
  vimMode,
  onSpellCheckChange,
  editorInstance,
}: UseEditorSpellCheckParams): void {
  // Handle spell check initialization
  useEffect(() => {
    const editor = editorInstance || editorRef.current
    const monacoInstance = monacoRef.current
    if (!editor || !monacoInstance || !spellCheck) return

    let isDisposed = false
    let checker: { process: () => void; dispose: () => void } | undefined

    const init = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - dynamic import of raw dictionary file
        const affData = (await import('typo-js/dictionaries/en_US/en_US.aff?raw')).default
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - dynamic import of raw dictionary file
        const dicData = (await import('typo-js/dictionaries/en_US/en_US.dic?raw')).default

        if (isDisposed) return

        const dictionary = new Typo('en_US', affData, dicData)

        const res = await getSpellchecker(monacoInstance, editor, {
          check: (word: string) => dictionary.check(word),
          suggest: (word: string) => dictionary.suggest(word),
        })

        if (isDisposed) {
          res.dispose()
          return
        }

        checker = res

        editor.onDidChangeModelContent(() => {
          if (checker) checker.process()
        })

        checker.process()
      } catch (e) {
        console.error('Failed to init spell check', e)
      }
    }

    init()

    return () => {
      isDisposed = true
      if (checker) {
        checker.dispose()
      }
      const model = editor.getModel()
      if (model && monacoInstance) {
        monacoInstance.editor.setModelMarkers(model, 'spellchecker', [])
      }
    }
  }, [spellCheck, editorInstance, monacoRef, editorRef])

  // Sync React spellCheck state -> Vim option
  useEffect(() => {
    if (!vimMode) return
    // React is the source of truth for the actual spell checker.
    // Vim state is synced via the onVimSpellCheckChange subscriber below.
  }, [spellCheck, vimMode])

  // Sync Vim -> React state
  useEffect(() => {
    const unsubscribe = onVimSpellCheckChange((enabled) => {
      onSpellCheckChange?.(enabled)
    })
    return unsubscribe
  }, [onSpellCheckChange])
}
