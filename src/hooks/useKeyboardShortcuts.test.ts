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
  }

  const triggerKeyDown = (key: string, options: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
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
        cancelable: true
    })
    
    // Define a getter for target if JSDOM is being weird?
    // No, standard dispatch should work.
    
    input.dispatchEvent(event)

    expect(handlers.onBold).not.toHaveBeenCalled()
    
    document.body.removeChild(input)
  })
})
