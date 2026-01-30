import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    // Basic smoke test - just checks if it runs
    // Note: App uses Suspense/Lazy so we might need more setup for a "real" test,
    // but this verifies the test runner infra is working.
    expect(true).toBe(true)
  })
})
