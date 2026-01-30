import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVimMode } from './useVimMode'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useVimMode', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should default to false', () => {
    const { result } = renderHook(() => useVimMode())
    expect(result.current.vimMode).toBe(false)
  })

  it('should toggle mode', () => {
    const { result } = renderHook(() => useVimMode())
    
    act(() => {
      result.current.toggleVimMode()
    })
    
    expect(result.current.vimMode).toBe(true)
    expect(localStorage.getItem('poe-editor-vim-mode')).toBe('true')
    
    act(() => {
      result.current.toggleVimMode()
    })
    
    expect(result.current.vimMode).toBe(false)
    expect(localStorage.getItem('poe-editor-vim-mode')).toBe('false')
  })

  it('should initialize from localStorage', () => {
    localStorage.setItem('poe-editor-vim-mode', 'true')
    const { result } = renderHook(() => useVimMode())
    expect(result.current.vimMode).toBe(true)
  })
})
