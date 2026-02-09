# Poe Editor App

The React SPA for Poe Markdown Editor, which supports live preview, Vim keybindings, and custom text transformation pipelines.

## Overview

This is the main application package containing the React frontend for the Poe Markdown Editor. Documents persist in the URL, requiring no backend storage or user accounts.

## Features

- Live preview with synchronised scrolling.
- Vim mode via Monaco Editor.
- 25+ text transformers with custom pipelines.
- URL-based document persistence (compressed).
- Dark and light themes.
- Mobile-optimised interface.

## Development

This package is part of a monorepo. Run all commands from the repository root:

```bash
# Install dependencies (from repo root)
npm install

# Start app dev server
npm run dev:app

# Or start both app and proxy
npm run dev

# Build the app
npm run build

# Run tests
npm test           # Unit tests
npm run test:e2e   # E2E tests
```

### Package-Specific Commands

If running directly in this package:

```bash
cd packages/app

# Start dev server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Deploy (manual)
npm run deploy
```

## Deployment

### Automatic (Recommended)

This app deploys to Cloudflare Pages via Git integration:

1. Go to _Cloudflare Dashboard → Pages_
2. Your project should already be connected to the repo
3. Update the build settings:
   - Root Directory: `packages/app/`
   - Build Command: `npm ci && npm run build`
   - Output Directory: `dist`

The app will deploy automatically on every push to main.

### Manual

```bash
# From repo root
npm run deploy:app

# Or from this package directory
npm run deploy
```

## Project Structure

```
packages/app/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── test/           # Test utilities
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── globals.css     # Global styles
├── public/             # Static assets
├── tests/              # E2E tests
└── dist/               # Build output
```

## Technical Stack

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for a VS Code-like editing experience.
- [Markdown-it](https://github.com/markdown-it/markdown-it) for extensible markdown parsing and rendering.
- [LZ-String](https://pieroxy.net/blog/pages/lz-string/index.html) for efficient URL-based state compression.

MIT License © 2026 Paul Chiu
