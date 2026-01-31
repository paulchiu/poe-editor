import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast, toast, _resetState } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetState()
  })

  afterEach(() => {
    vi.useRealTimers()
    _resetState()
  })

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Test Toast' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].open).toBe(true)
  })

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastControl: ReturnType<typeof toast>
    act(() => {
      toastControl = result.current.toast({ title: 'Initial' })
    })

    expect(result.current.toasts[0].title).toBe('Initial')

    act(() => {
      toastControl.update({ title: 'Updated' })
    })

    let t: ReturnType<typeof toast>
    act(() => {
      t = toast({ title: 'To Update' })
    })

    act(() => {
      t.update({ title: 'Updated Content' })
    })

    expect(result.current.toasts[0].title).toBe('Updated Content')
  })

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast())
    let t: ReturnType<typeof toast>

    act(() => {
      t = toast({ title: 'To Dismiss' })
    })

    expect(result.current.toasts[0].open).toBe(true)

    act(() => {
      t.dismiss()
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it('should remove toast after delay when dismissed', () => {
    const { result } = renderHook(() => useToast())
    let t: ReturnType<typeof toast>

    act(() => {
      t = toast({ title: 'To Remove' })
    })

    act(() => {
      t.dismiss()
    })

    act(() => {
      vi.advanceTimersByTime(1000000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should limit toasts to 1', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Toast 1' })
      toast({ title: 'Toast 2' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 2')
  })
})
