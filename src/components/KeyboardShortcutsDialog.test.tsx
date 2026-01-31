import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'

describe('KeyboardShortcutsDialog', () => {
  it('renders standard shortcuts when open', () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={() => {}} vimModeEnabled={false} />)

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Formatting')).toBeInTheDocument()
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(screen.getByText('Cmd/Ctrl + B')).toBeInTheDocument()
  })

  it('renders vim shortcuts when vimModeEnabled is true', () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={() => {}} vimModeEnabled={true} />)

    expect(screen.getByText('Vim Mode')).toBeInTheDocument()
    expect(screen.getByText('Enter Normal Mode')).toBeInTheDocument()
    expect(screen.getAllByText('Esc').length).toBeGreaterThan(0)
  })

  it('does not render vim shortcuts when vimModeEnabled is false', () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={() => {}} vimModeEnabled={false} />)

    expect(screen.queryByText('Vim Mode')).not.toBeInTheDocument()
  })

  it('calls onOpenChange when close button is clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <KeyboardShortcutsDialog open={true} onOpenChange={onOpenChange} vimModeEnabled={false} />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
