import { useState, useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from 'react'
import { executeCommand, getCommandNames, type ShellState, type CommandResult } from './commands'
import { completePath, HOME } from './filesystem'
import { ShutdownOverlay } from './ShutdownOverlay'

// -- Types --

interface FakeShellProps {
  onExit: () => void
}

// -- ANSI color map --

const ANSI_COLOR_MAP: Record<string, CSSProperties> = {
  '1;34': { color: '#5555ff', fontWeight: 'bold' },
  '1;32': { color: '#00ff00', fontWeight: 'bold' },
  '1;37': { color: '#ffffff', fontWeight: 'bold' },
  '0': {},
}

const DEFAULT_STYLE: CSSProperties = { color: '#00ff00' }

// -- ANSI rendering helper --

function renderAnsi(text: string): ReactNode {
  const regex = /\x1b\[([0-9;]*)m/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let currentStyle: CSSProperties = { ...DEFAULT_STYLE }
  let match: RegExpExecArray | null
  let key = 0

  match = regex.exec(text)
  while (match !== null) {
    // Push the text segment before this escape sequence
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index)
      parts.push(
        <span key={key++} style={currentStyle}>
          {segment}
        </span>
      )
    }

    // Update the current style
    const code = match[1]
    if (code === '0' || code === '') {
      currentStyle = { ...DEFAULT_STYLE }
    } else if (ANSI_COLOR_MAP[code]) {
      currentStyle = { ...ANSI_COLOR_MAP[code] }
    }

    lastIndex = match.index + match[0].length
    match = regex.exec(text)
  }

  // Push any remaining text after the last escape sequence
  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex)
    parts.push(
      <span key={key++} style={currentStyle}>
        {segment}
      </span>
    )
  }

  // If there were no ANSI codes at all, return the plain text
  if (parts.length === 0) {
    return <span style={DEFAULT_STYLE}>{text}</span>
  }

  return parts
}

// -- Prompt helper --

function getPrompt(cwd: string): string {
  const display = cwd.startsWith(HOME)
    ? '~' + cwd.slice(HOME.length)
    : cwd
  return `edgar@poe-editor:${display || '~'}$ `
}

// -- MOTD banner --

function buildMotd(): string {
  const now = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const dayName = days[now.getDay()]
  const monthName = months[now.getMonth()]
  const date = String(now.getDate()).padStart(2, ' ')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const year = now.getFullYear()

  const dateStr = `${dayName} ${monthName} ${date} ${hours}:${minutes}:${seconds} ${year}`

  return [
    'PoeOS 6.6.6-poe (tty1)',
    '',
    'poe-editor login: edgar',
    `Last login: ${dateStr} on tty1`,
    '',
  ].join('\n')
}

// -- Static inline styles --

const shellStyles: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  backgroundColor: '#000000',
  color: '#00ff00',
  fontFamily: "'Courier New', 'Consolas', monospace",
  fontSize: '14px',
  textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
}

const outputStyles: CSSProperties = {
  flexGrow: 1,
  overflowY: 'auto',
  padding: '8px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const inputLineStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px 8px 8px',
  whiteSpace: 'pre',
}

const inputStyles: CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#00ff00',
  fontFamily: "'Courier New', 'Consolas', monospace",
  fontSize: '14px',
  textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
  flexGrow: 1,
  caretColor: '#00ff00',
}

// -- Component --

export function FakeShell({ onExit }: FakeShellProps) {
  const [lines, setLines] = useState<string[]>(() => buildMotd().split('\n'))
  const [input, setInput] = useState('')
  const [shellState, setShellState] = useState<ShellState>({ cwd: HOME })
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isShutdown, setIsShutdown] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-scroll to bottom whenever lines change
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [])

  const prompt = getPrompt(shellState.cwd)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const currentInput = input
        const currentPrompt = prompt

        // Add the prompt + input line to output
        const newLines = [...lines, currentPrompt + currentInput]

        // Execute the command
        const result: CommandResult = executeCommand(currentInput, shellState)

        // Update shell state if cwd changed
        if (result.newCwd) {
          setShellState({ cwd: result.newCwd })
        }

        // Handle clear
        if (result.clear) {
          setLines([])
          setInput('')
          if (currentInput.trim()) {
            setHistory((prev) => [...prev, currentInput])
          }
          setHistoryIndex(-1)
          return
        }

        // Append output lines
        let updatedLines = newLines
        if (result.output) {
          const outputLines = result.output.split('\n')
          updatedLines = [...newLines, ...outputLines]
        }
        setLines(updatedLines)

        // Clear input
        setInput('')

        // Update history
        if (currentInput.trim()) {
          setHistory((prev) => [...prev, currentInput])
        }
        setHistoryIndex(-1)

        // Handle shutdown
        if (result.shutdown) {
          setIsShutdown(true)
          return
        }

        // Handle exit
        if (result.exit) {
          if (result.output) {
            setTimeout(() => {
              onExit()
            }, 1000)
          } else {
            onExit()
          }
          return
        }

        // Schedule a scroll after state updates
        setTimeout(scrollToBottom, 0)
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()

        const tokens = input.split(/\s+/)
        const isFirstToken = tokens.length <= 1

        if (isFirstToken) {
          // Complete against command names
          const partial = tokens[0] ?? ''
          const commandNames = getCommandNames()
          const matches = commandNames.filter((name) => name.startsWith(partial))

          if (matches.length === 1) {
            setInput(matches[0] + ' ')
          } else if (matches.length > 1) {
            setLines((prev) => [...prev, prompt + input, matches.join('  ')])
          }
        } else {
          // Complete against filesystem paths
          const partial = tokens[tokens.length - 1] ?? ''
          const matches = completePath(shellState.cwd, partial)

          if (matches.length === 1) {
            const completed = [...tokens.slice(0, -1), matches[0]].join(' ')
            setInput(completed)
          } else if (matches.length > 1) {
            setLines((prev) => [...prev, prompt + input, matches.join('  ')])
          }
        }
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (history.length === 0) return

        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (historyIndex === -1) return

        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
        return
      }

      // Ctrl+C: cancel current input
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault()
        setLines((prev) => [...prev, prompt + input + '^C'])
        setInput('')
        setHistoryIndex(-1)
        return
      }

      // Ctrl+L: clear screen
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault()
        setLines([])
        return
      }
    },
    [input, lines, prompt, shellState, history, historyIndex, onExit, scrollToBottom]
  )

  const handleShellClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  if (isShutdown) {
    return <ShutdownOverlay />
  }

  return (
    <div style={shellStyles} onClick={handleShellClick}>
      <div ref={outputRef} style={outputStyles}>
        {lines.map((line, i) => (
          <div key={i}>{renderAnsi(line)}</div>
        ))}
      </div>
      <div style={inputLineStyles}>
        <span>{prompt}</span>
        <input
          ref={inputRef}
          style={inputStyles}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
