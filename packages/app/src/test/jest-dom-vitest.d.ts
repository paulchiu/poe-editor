/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars -- interface merges must repeat vitest's type parameters */
import 'vitest'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

/**
 * Registers jest-dom matchers on vitest 5's `Matchers<R, T>`; jest-dom 7.0.1 still augments the
 * pre-5 `Assertion<T>` signature, which no longer merges.
 * TODO: Drop once @testing-library/jest-dom ships vitest 5 typings.
 */
declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<unknown, R> {}
}
