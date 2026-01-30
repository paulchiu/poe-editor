# Project Context & Coding Standards

> **Purpose:** This file provides context, rules, and constraints for AI agents interacting with this codebase.
> **Audience:** AI Coding Assistants (Copilot, Cursor, Windsurf, etc.).

## 1. Project Context

* **Type:** Single Page Application (SPA).
* **Language:** TypeScript (Strict mode, **ES2022 target**).
* **Framework:** React 19 (Functional components only).
* **Styling:** Tailwind CSS (v4) + Shadcn UI.
* **Package Manager:** pnpm.
* **Testing:** Vitest + React Testing Library.

## 2. Core Architectural Principles

* **Functional Programming First:**
  * Prefer **pure functions** wherever possible. Extract logic out of components into pure utility functions in `/utils`.
  * **Immutability:** Avoid mutation. Use `const` by default.
  * **No Classes:** Use closures or module-level functions.
* **Type-Based Architecture:**
  * `/src/components` - React components (Shadcn in `/components/ui`).
  * `/src/hooks` - Custom hooks (prefix with `use`).
  * `/src/utils` - Pure utility functions (e.g., business logic, `classnames.ts`).
  * `/src/test` - Test setup and global mocks. *(Planned: Not yet configured)*
  * `/src/pages` - Route views. *(Planned: As application grows)*
  * **Path Aliases:** Use `@/*` to reference `/src/*` (e.g., `@/components/ui/button`, `@/hooks/useUrlState`).
* **State Management:**
  * **Server State:** TanStack Query.
  * **Client State:** URL Query Parameters (primary truth) > React Context. Avoid global stores (Redux/Zustand) unless strictly necessary.

## 3. Naming & File Conventions

* **File Naming (Strict):**
  * **Components:** `PascalCase.tsx` (e.g., `EditorPane.tsx`, `UserProfile.tsx`).
  * **Hooks:** `camelCase.ts` with `use` prefix (e.g., `useUrlState.ts`, `useTheme.ts`).
  * **Utilities:** `camelCase.ts` (e.g., `compression.ts`, `dateUtils.ts`).
  * **Tests:** `*.test.ts` or `*.test.tsx` (colocated with source).
* **Symbol Naming:**
  * **Components:** `PascalCase` (e.g., `function UserProfile()`).
  * **Hooks:** `camelCase` with `use` prefix.
  * **Constants:** `SCREAMING_SNAKE_CASE`.
  * **Types:** `PascalCase` (e.g., `UserProfileProps`).
* **Exports:**
  * Simple Components: Default export allowed.
  * `forwardRef` Components: Named export (`export const`) + `displayName`.
  * Functions: Explicit return types required on ALL exported functions.

## 4. Coding Standards (Strict)

* **Formatting (Prettier):**
  * Semi: `false`
  * Single Quote: `true`
  * Trailing Comma: `es5`
  * Print Width: `100`
  * Tab Width: `2`
* **TypeScript:**
  * **No `any`**: Use `unknown` and narrow.
  * **Props:** Define interface above component, suffixed with `Props` (e.g., `ButtonProps`).
  * **Type Imports:** Use `import type { ... }` for type-only imports.
* **Documentation (JSDoc):**
  * Required for all public/exported functions and hooks.
  * Must specify `@param` and `@returns`.
  * Keep comments minimal; prefer self-documenting code.
* **Error Handling:**
  * **Recoverable Errors:** Return `null` (e.g., decompression failure).
  * **User Feedback:** Use callbacks (`onError`) or toast messages. Never swallow errors silently.

## 5. Testing Strategy *(Planned: Not yet configured)*

* **Framework:** Vitest + React Testing Library.
* **Coverage:** Target 80%+.
* **Location:** Colocated with source (e.g., `utils/compression.ts` -> `utils/compression.test.ts`).
* **Philosophy:**
  * **Pure Functions:** 100% coverage required (edge cases + error handling).
  * **Integration:** Test critical user flows; avoid excessive mocking of internal hooks.
  * **Structure:** Use `describe` blocks, `beforeEach` for cleanup, and descriptive `it` names (starting with lowercase verbs).

## 6. Operation Manual

* **Install:** `pnpm install`
* **Dev:** `pnpm dev`
* **Test:** `pnpm test`
* **Lint:** `pnpm lint` (Zero warnings tolerance).

## 7. Git Commit Convention

* Format: `type: description`
* Types:
  * `feat:` New feature
  * `fix:` Bug fix
  * `chore:` Maintenance/Dependencies
  * `test:` Adding/updating tests
  * `docs:` Documentation only

## 8. "Do Not" Rules

1. **DO NOT** use class components.
2. **DO NOT** use `console.log` in final code.
3. **DO NOT** import React namespace (e.g., `import React from 'react'` or `import * as React from 'react'`). JSX Transform is enabled; import only what you need.
4. **DO NOT** force "Strict TDD" (write test first) unless helpful; allow pragmatic development but ensure tests exist before completion.
