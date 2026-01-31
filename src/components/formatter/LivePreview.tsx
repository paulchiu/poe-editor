import { useState, useMemo } from 'react'
import { applyPipeline } from '@/utils/formatter-engine'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TransformationPipeline } from './types'

interface LivePreviewProps {
  pipeline: TransformationPipeline
}

const SAMPLE_TEXT = `Hello World
hello world
HELLO WORLD
duplicate line
duplicate line`

export function LivePreview({ pipeline }: LivePreviewProps) {
  const [inputText, setInputText] = useState(SAMPLE_TEXT)

  const outputText = useMemo(() => {
    return applyPipeline(inputText, pipeline)
  }, [inputText, pipeline])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 flex flex-col min-h-0 border-b">
        <div className="p-3 border-b bg-muted/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Input</span>
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
