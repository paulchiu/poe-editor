import { useState, useMemo, type ReactElement } from 'react'
import { applyPipeline } from '@/utils/transformer-engine'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TransformationPipeline } from './types'

interface TransformerPreviewProps {
  pipeline: TransformationPipeline
  initialText?: string
}

const SAMPLE_TEXT = `Hello World
hello world
HELLO WORLD
duplicate line
duplicate line`

/**
 * Transformer preview pane showing the output of a transformation pipeline.
 * @param props - Component props
 * @returns Transformer preview component
 */
export function TransformerPreview({
  pipeline,
  initialText,
}: TransformerPreviewProps): ReactElement {
  const [inputText, setInputText] = useState(initialText || SAMPLE_TEXT)
  const [prevInitialText, setPrevInitialText] = useState(initialText)

  // Update input text if initialText prop changes (derived state)
  if (initialText !== prevInitialText) {
    setInputText(initialText || SAMPLE_TEXT)
    setPrevInitialText(initialText)
  }

  const outputText = useMemo(() => {
    return applyPipeline(inputText, pipeline)
  }, [inputText, pipeline])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 flex flex-col min-h-0 border-b">
        <div className="p-3 border-b bg-muted/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Input
          </span>
          <span className="text-xs text-muted-foreground font-mono">{inputText.length} chars</span>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
          placeholder="Paste text here to test..."
          spellCheck={false}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
        <div className="p-3 border-b bg-muted/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Output</span>
          <span className="text-xs text-muted-foreground font-mono">{outputText.length} chars</span>
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-foreground/90">
            {outputText}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
