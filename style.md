# style.md

## Language & Runtime

- **TypeScript** with strict mode enabled (`strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes`)
- **Target:** ES2022
- **React 19** — functional components and hooks only (no class components)
- **JSX Transform:** `react-jsx` (no `import React` needed)

## Formatting

- **Prettier** handles all formatting
- 2 spaces indentation
- No semicolons
- Single quotes
- Trailing commas (ES5 style)
- 100 character line width

```json
{
  "semi": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Code Conventions

### Functions

- Explicit return types on all exported functions
- Pure functions for utilities (no side effects)
- Custom hooks for stateful logic and side effects
- JSDoc comments required for all exported functions

```typescript
/**
 * Compresses text to a URL-safe hash string using LZ compression
 * @param text - The text to compress
 * @returns Compressed, URL-encoded string (empty string if input is empty)
 */
export function compressToHash(text: string): string {
  if (!text) return ''
  return compressToEncodedURIComponent(text)
}
```

### Components

- Functional components only
- Props interface defined above component, suffixed with `Props`
- Destructure props in function signature
- Explicit `ReactElement` return type
- Default exports for simple components
- Named exports with `export const` for `forwardRef` components
- Set `displayName` for `forwardRef` components

```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export default function Button({
  label,
  onClick,
  disabled = false,
}: ButtonProps): ReactElement {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

**forwardRef pattern:**

```typescript
export interface EditorPaneHandle {
  insertText: (text: string) => void
  getSelection: () => string | undefined
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  ({ value, onChange }, ref) => {
    // ...
  }
)

EditorPane.displayName = 'EditorPane'
```

### Hooks

- Prefix with `use`
- Options interface suffixed with `Options`
- Return interface suffixed with `Return`
- Document with JSDoc for public APIs

```typescript
interface UseThemeOptions {
  defaultTheme?: Theme
}

interface UseThemeReturn {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/**
 * Manages theme state with localStorage persistence.
 */
export function useTheme(options?: UseThemeOptions): UseThemeReturn {
  // ...
}
```

### Naming

| Type             | Convention                  | Example                  |
| ---------------- | --------------------------- | ------------------------ |
| Components       | PascalCase                  | `EditorPane.tsx`         |
| Hooks            | camelCase with `use` prefix | `useUrlState.ts`         |
| Utilities        | camelCase                   | `compression.ts`         |
| Test files       | `*.test.ts` or `*.test.tsx` | `compression.test.ts`    |
| Constants        | SCREAMING_SNAKE_CASE        | `MAX_URL_LENGTH`         |
| Types/Interfaces | PascalCase                  | `EditorPaneProps`        |
| Event handlers   | `on` prefix                 | `onClick`, `onDismiss`   |
| State setters    | `set` prefix                | `setContent`, `setTheme` |

### Type Patterns

- Use discriminated unions for constrained values
- Use `type` imports for type-only imports
- No `any` types — use `unknown` and narrow

```typescript
type Theme = 'light' | 'dark'
type ToastType = 'info' | 'warning' | 'error' | 'success'

import { type ReactElement } from 'react'
import type { editor } from 'monaco-editor'
```

## Testing

- **Framework:** Vitest + React Testing Library
- **Coverage target:** 80%+
- Test files colocated with source (`utils/compression.test.ts`)
- Setup file: `src/test/setup.ts`
- Global mocks in setup file, component-specific mocks in test files

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with light theme when no preference stored', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggles between light and dark themes', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
  })
})
```

### What to Test

- Utility functions: all edge cases, error handling
- Hooks: state changes, side effects, cleanup
- Components: rendering, user interactions, accessibility
- Integration: critical user flows

### Test Conventions

- Nested `describe` blocks for organization
- `beforeEach`/`afterEach` for setup/teardown
- Descriptive names starting with lowercase verbs: `it('renders...')`, `it('initializes...')`
- Test behavior, not implementation details
- Use `vi.useFakeTimers()` for debounce/timeout testing

## Documentation

- JSDoc comments for exported functions and hooks
- Keep comments minimal — prefer self-documenting code
- Document `@param` and `@returns` for all public functions

```typescript
/**
 * Downloads a file with the given content to the user's computer
 * @param filename - The name of the file to download
 * @param content - The content to write to the file
 * @param mimeType - The MIME type of the file (defaults to text/plain)
 */
export function downloadFile(
  filename: string,
  content: string,
  mimeType: string = 'text/plain'
): void {
  // ...
}
```

## Git Commits

Conventional commit format:

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance, dependencies
- `test:` — adding or updating tests
- `docs:` — documentation only

```
feat: add compression utilities with tests
fix: handle null decompression result
chore: update dependencies
test: add edge cases for markdown rendering
docs: add keyboard shortcuts to README
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── utils/          # Pure utility functions
├── test/           # Test setup and mocks
├── App.tsx         # Root component
├── main.tsx        # Entry point
└── index.css       # Global styles (TailwindCSS v4)
```

## Error Handling

- Return `null` for recoverable failures (e.g., decompression)
- Use callbacks for error reporting (`onError`, `onWarning`)
- Show user-friendly toast messages for errors
- Never swallow errors silently
- Early return pattern for null/empty checks

```typescript
/**
 * Decompresses a URL-safe hash string back to original text
 * @param hash - The compressed hash to decompress
 * @returns Original text, empty string if input empty, null if decompression fails
 */
export function decompressFromHash(hash: string): string | null {
  if (!hash) return ''
  try {
    const result = decompressFromEncodedURIComponent(hash)
    return result ?? null
  } catch {
    return null
  }
}
```

## Linting

- ESLint with `@typescript-eslint/recommended`
- React Hooks rules enforced (`react-hooks/recommended`)
- Prettier integration to avoid formatting conflicts
- Zero warnings tolerance (`npm run lint`)
