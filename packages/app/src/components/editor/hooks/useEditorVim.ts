import { useEffect } from 'react'
import type { editor } from 'monaco-editor'
import { initVimMode, type VimMode as VimAdapter } from 'monaco-vim'
import { toast } from '@/hooks/useToast'

interface UseEditorVimParams {
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
  vimInstanceRef: React.MutableRefObject<VimAdapter | null>
  statusBarRef: React.RefObject<HTMLDivElement | null>
  vimMode?: boolean
}

/**
 * Manages the Vim mode lifecycle for the Monaco editor.
 * Initializes and disposes vim mode based on the vimMode prop.
 *
 * @param params - Editor ref, vim instance ref, status bar ref, and vimMode flag
 * @returns void
 */
export function useEditorVim({
  editorRef,
  vimInstanceRef,
  statusBarRef,
  vimMode,
}: UseEditorVimParams): void {
  useEffect(() => {
    if (!vimMode) {
      if (vimInstanceRef.current) {
        vimInstanceRef.current.dispose()
        vimInstanceRef.current = null
      }
      return
    }

    const ed = editorRef.current
    const statusBar = statusBarRef.current

    if (!ed || !statusBar || vimInstanceRef.current) {
      return
    }

    const timer = setTimeout(() => {
      if (editorRef.current && statusBarRef.current && !vimInstanceRef.current) {
        try {
          vimInstanceRef.current = initVimMode(editorRef.current, statusBarRef.current)
        } catch {
          toast({
            description: 'Error initializing vim mode',
            variant: 'destructive',
          })
        }
      }
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [vimMode, editorRef, vimInstanceRef, statusBarRef])
}
