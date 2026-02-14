import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  const handlers = {
    onBold: vi.fn(),
    onItalic: vi.fn(),
    onLink: vi.fn(),
    onCode: vi.fn(),
    onCodeBlock: vi.fn(),
    onSave: vi.fn(),
    onHelp: vi.fn(),
    onNew: vi.fn(),
    onRename: vi.fn(),
    onClear: vi.fn(),
    onCopyLink: vi.fn(),
    onReset: vi.fn(),
    onHeading: vi.fn(),
    onQuote: vi.fn(),
    onBulletList: vi.fn(),
    onNumberedList: vi.fn(),
    onTable: vi.fn(),
    onTransform: vi.fn(),
    onDownload: vi.fn(),
    onFocusEditor: vi.fn(),
    onFocusDocument: vi.fn(),
  }

  const triggerKeyDown = (key: string, options: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      code: options.code || `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
      ...options,
    })
    window.dispatchEvent(event)
    return event
  }

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should trigger onBold with Cmd+B', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    const event = triggerKeyDown('b', { metaKey: true })
    expect(handlers.onBold).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('should trigger onItalic with Cmd+I', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('i', { metaKey: true })
    expect(handlers.onItalic).toHaveBeenCalled()
  })

  it('should trigger onLink with Cmd+K', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('k', { metaKey: true })
    expect(handlers.onLink).toHaveBeenCalled()
  })

  it('should trigger onCodeBlock with Cmd+Shift+K', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('k', { metaKey: true, shiftKey: true })
    expect(handlers.onCodeBlock).toHaveBeenCalled()
    expect(handlers.onLink).not.toHaveBeenCalled()
  })

  it('should trigger onHelp with ? outside of inputs', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('?')
    expect(handlers.onHelp).toHaveBeenCalled()
  })

  it('should trigger onNew with Cmd+Alt+N', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('n', { metaKey: true, altKey: true })
    expect(handlers.onNew).toHaveBeenCalled()
  })

  it('should trigger onCopyLink with Cmd+Alt+L', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('l', { metaKey: true, altKey: true })
    expect(handlers.onCopyLink).toHaveBeenCalled()
  })

  it('should trigger onReset with Cmd+Alt+0', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    const event = triggerKeyDown('0', { metaKey: true, altKey: true, code: 'Digit0' })
    expect(handlers.onReset).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('should trigger onClear with Cmd+Alt+K', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('k', { metaKey: true, altKey: true })
    expect(handlers.onClear).toHaveBeenCalled()
  })

  it('should trigger onRename with Cmd+Alt+R', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('r', { metaKey: true, altKey: true })
    expect(handlers.onRename).toHaveBeenCalled()
  })

  it('should trigger onRename with F2', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('F2')
    expect(handlers.onRename).toHaveBeenCalled()
  })

  it('should trigger onHeading with Cmd+Alt+1/2/3', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('1', { metaKey: true, altKey: true, code: 'Digit1' })
    expect(handlers.onHeading).toHaveBeenCalledWith(1)
    triggerKeyDown('2', { metaKey: true, altKey: true, code: 'Digit2' })
    expect(handlers.onHeading).toHaveBeenCalledWith(2)
    triggerKeyDown('3', { metaKey: true, altKey: true, code: 'Digit3' })
    expect(handlers.onHeading).toHaveBeenCalledWith(3)
  })

  it('should trigger onQuote with Cmd+Alt+B', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('b', { metaKey: true, altKey: true, code: 'KeyB' })
    expect(handlers.onQuote).toHaveBeenCalled()
  })

  it('should trigger onFocusEditor with Cmd+Alt+E', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('e', { metaKey: true, altKey: true, code: 'KeyE' })
    expect(handlers.onFocusEditor).toHaveBeenCalled()
  })

  it('should trigger onFocusDocument with Cmd+Alt+A', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('a', { metaKey: true, altKey: true, code: 'KeyA' })
    expect(handlers.onFocusDocument).toHaveBeenCalled()
  })

  it('should trigger formatting shortcuts with Cmd+Shift', () => {
    renderHook(() => useKeyboardShortcuts(handlers))
    triggerKeyDown('u', { metaKey: true, shiftKey: true })
    expect(handlers.onBulletList).toHaveBeenCalled()
    triggerKeyDown('o', { metaKey: true, shiftKey: true })
    expect(handlers.onNumberedList).toHaveBeenCalled()
    triggerKeyDown('t', { metaKey: true, shiftKey: true })
    expect(handlers.onTable).toHaveBeenCalled()
    triggerKeyDown('m', { metaKey: true, shiftKey: true })
    expect(handlers.onTransform).toHaveBeenCalled()
    triggerKeyDown('s', { metaKey: true, shiftKey: true })
    expect(handlers.onDownload).toHaveBeenCalled()
  })

  it('should NOT trigger shortcuts when typing in an input', () => {
    renderHook(() => useKeyboardShortcuts(handlers))

    // Create an input and focus it
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    // Dispatch event specifically on the input manually
    // The previous failure means the handler was invoked.
    // The handler checks event.target.
    // When we use input.dispatchEvent, event.target should be the input.

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })

    // Define a getter for target if JSDOM is being weird?
    // No, standard dispatch should work.

    input.dispatchEvent(event)

    expect(handlers.onBold).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })
})
