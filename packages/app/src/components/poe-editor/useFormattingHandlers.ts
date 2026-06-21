import { useCallback, type RefObject } from 'react'
import type { EditorPaneHandle, TableAction } from '@/components/editor'
import {
  formatBold,
  formatBulletList,
  formatCode,
  formatCodeBlock,
  formatHeading,
  formatItalic,
  formatLink,
  formatNumberedList,
  formatQuote,
  formatTaskList,
  unformatQuote,
} from '@/utils/formatting'

interface UseFormattingHandlersParams {
  sourceRef: RefObject<EditorPaneHandle | null>
}

interface FormattingHandlers {
  handleFormatBold: () => void
  handleFormatItalic: () => void
  handleFormatLink: () => void
  handleFormatCode: () => void
  handleFormatCodeBlock: () => void
  handleFormatHeading: (level: number) => void
  handleFormatQuote: () => void
  handleFormatUnquote: () => void
  handleFormatBulletList: () => void
  handleFormatNumberedList: () => void
  handleFormatTaskList: () => void
  handleFormatTable: () => void
  handleFormatAllTables: () => void
  handleTableAction: (action: TableAction) => void
  handleFormat: (type: 'bold' | 'italic' | 'link' | 'code') => void
}

/**
 * Builds editor formatting and table-action callbacks bound to the current editor ref.
 * @param params - Hook configuration.
 * @returns Formatting and table action handlers.
 */
export function useFormattingHandlers({
  sourceRef,
}: UseFormattingHandlersParams): FormattingHandlers {
  const handleFormatBold = useCallback((): void => {
    formatBold(sourceRef.current)
  }, [sourceRef])

  const handleFormatItalic = useCallback((): void => {
    formatItalic(sourceRef.current)
  }, [sourceRef])

  const handleFormatLink = useCallback((): void => {
    formatLink(sourceRef.current)
  }, [sourceRef])

  const handleFormatCode = useCallback((): void => {
    formatCode(sourceRef.current)
  }, [sourceRef])

  const handleFormatCodeBlock = useCallback((): void => {
    formatCodeBlock(sourceRef.current)
  }, [sourceRef])

  const handleFormatHeading = useCallback(
    (level: number): void => {
      formatHeading(sourceRef.current, level)
    },
    [sourceRef]
  )

  const handleFormatQuote = useCallback((): void => {
    formatQuote(sourceRef.current)
  }, [sourceRef])

  const handleFormatUnquote = useCallback((): void => {
    unformatQuote(sourceRef.current)
  }, [sourceRef])

  const handleFormatBulletList = useCallback((): void => {
    formatBulletList(sourceRef.current)
  }, [sourceRef])

  const handleFormatNumberedList = useCallback((): void => {
    formatNumberedList(sourceRef.current)
  }, [sourceRef])

  const handleFormatTaskList = useCallback((): void => {
    formatTaskList(sourceRef.current)
  }, [sourceRef])

  const handleFormatTable = useCallback((): void => {
    sourceRef.current?.performTableAction('format-table')
  }, [sourceRef])

  const handleFormatAllTables = useCallback((): void => {
    sourceRef.current?.formatAllTables()
  }, [sourceRef])

  const handleTableAction = useCallback(
    (action: TableAction): void => {
      sourceRef.current?.performTableAction(action)
    },
    [sourceRef]
  )

  const handleFormat = useCallback(
    (type: 'bold' | 'italic' | 'link' | 'code'): void => {
      switch (type) {
        case 'bold':
          handleFormatBold()
          break
        case 'italic':
          handleFormatItalic()
          break
        case 'link':
          handleFormatLink()
          break
        case 'code':
          handleFormatCode()
          break
      }
    },
    [handleFormatBold, handleFormatCode, handleFormatItalic, handleFormatLink]
  )

  return {
    handleFormatBold,
    handleFormatItalic,
    handleFormatLink,
    handleFormatCode,
    handleFormatCodeBlock,
    handleFormatHeading,
    handleFormatQuote,
    handleFormatUnquote,
    handleFormatBulletList,
    handleFormatNumberedList,
    handleFormatTaskList,
    handleFormatTable,
    handleFormatAllTables,
    handleTableAction,
    handleFormat,
  }
}
