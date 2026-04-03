import { useEffect, useState } from 'react'

const MESSAGES = [
  'Broadcast message from edgar@poe-editor:',
  '  The system is going down for poweroff NOW!',
  '',
  '[  OK  ] Stopped Poe Markdown Daemon',
  '[  OK  ] Stopped Session Manager for edgar',
  '[  OK  ] Unmounted /dev/inspiration',
  '[  OK  ] Deactivated swap: /dev/writers-block',
  '[  OK  ] Stopped Creative Writing Service',
  '[  OK  ] Stopped NetworkManager',
  '[  OK  ] Reached target Shutdown',
  '[  OK  ] Reached target Final Step',
  '         Powering off...',
]

const OK_PREFIX = '[  OK  ] '

const baseStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: '#000000',
}

const containerStyle: React.CSSProperties = {
  ...baseStyle,
  fontFamily: "'Courier New', 'Consolas', monospace",
  fontSize: 14,
  color: '#00ff00',
  padding: 20,
}

const poweredOffStyle: React.CSSProperties = {
  ...baseStyle,
}

export function ShutdownOverlay() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [poweredOff, setPoweredOff] = useState(false)

  useEffect(() => {
    if (visibleCount >= MESSAGES.length) return

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + 1
        if (next >= MESSAGES.length) {
          clearInterval(interval)
        }
        return next
      })
    }, 400)

    return () => clearInterval(interval)
  }, [visibleCount])

  useEffect(() => {
    if (visibleCount < MESSAGES.length) return

    const timeout = setTimeout(() => {
      setPoweredOff(true)
    }, 800)

    return () => clearTimeout(timeout)
  }, [visibleCount])

  if (poweredOff) {
    return <div style={poweredOffStyle} />
  }

  return (
    <div style={containerStyle}>
      {MESSAGES.slice(0, visibleCount).map((msg, i) => (
        <div key={i}>
          {msg.startsWith(OK_PREFIX) ? (
            <>
              <span style={{ color: '#00ff00' }}>{OK_PREFIX}</span>
              <span style={{ color: '#cccccc' }}>
                {msg.slice(OK_PREFIX.length)}
              </span>
            </>
          ) : (
            <span style={{ color: '#00ff00' }}>{msg}</span>
          )}
        </div>
      ))}
    </div>
  )
}
