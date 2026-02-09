import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SplashScreen, TAGLINES } from './SplashScreen'

describe('SplashScreen', () => {
  it('renders a random tagline on mount', () => {
    render(<SplashScreen onComplete={() => {}} isLoading={false} />)
    const taglineElement = screen.getByText((content) => {
      return TAGLINES.includes(content)
    })
    expect(taglineElement).toBeInTheDocument()
  })

  it('refreshes tagline when "r" is pressed in debug mode', () => {
    render(<SplashScreen onComplete={() => {}} isLoading={false} debug={true} />)

    // Get initial tagline
    const initialTagline = screen.getByText((content) => TAGLINES.includes(content)).textContent

    // Press 'r' multiple times until tagline changes (since random might pick the same one)
    let currentTagline = initialTagline
    let attempts = 0
    while (currentTagline === initialTagline && attempts < 10) {
      fireEvent.keyDown(window, { key: 'r' })
      currentTagline = screen.getByText((content) => TAGLINES.includes(content)).textContent
      attempts++
    }

    // It should have changed
    expect(currentTagline).not.toBe(initialTagline)
    expect(TAGLINES).toContain(currentTagline)
  })

  it('does not refresh tagline when "r" is pressed if not in debug mode', () => {
    render(<SplashScreen onComplete={() => {}} isLoading={false} debug={false} />)

    const initialTagline = screen.getByText((content) => TAGLINES.includes(content)).textContent

    fireEvent.keyDown(window, { key: 'r' })
    const postPressTagline = screen.getByText((content) => TAGLINES.includes(content)).textContent

    expect(postPressTagline).toBe(initialTagline)
  })
})
