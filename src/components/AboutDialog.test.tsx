import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AboutDialog } from './AboutDialog'

describe('AboutDialog', () => {
  it('renders content when open', () => {
    render(<AboutDialog open={true} onOpenChange={() => {}} />)

    expect(screen.getByText('About Poe')).toBeInTheDocument()
    expect(screen.getByText('Modal editing for Markdown')).toBeInTheDocument()
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<AboutDialog open={false} onOpenChange={() => {}} />)

    expect(screen.queryByText('About Poe')).not.toBeInTheDocument()
  })

  it('calls onOpenChange when close button or overlay is clicked', () => {
    const onOpenChange = vi.fn()
    render(<AboutDialog open={true} onOpenChange={onOpenChange} />)

    // Radix UI Dialog close button usually has text or is an icon.
    // In our case, it's the default Shadcn DialogContent.
    // It usually has a close button with "Close" sr-only text.
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
