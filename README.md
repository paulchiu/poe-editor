# Poe Markdown Editor

A Markdown editor with live preview, Vim keybindings, and custom text transformation pipelines. Documents persist in the URL, no accounts or storage required.

[Try it now](https://poemd.dev)

## Overview

Poe combines a clean writing interface with practical tools for text manipulation. It is built for developers and technical writers who need more than a basic editor, without the overhead of account management or cloud dependencies.

### URL-Based Persistence

Document state is compressed and stored in the URL fragment. Copy the URL to share, bookmark for later, or access offline. No backend storage or user accounts.

### Text Transformation Pipelines

The editor includes 25+ text operations that can be chained into reusable pipelines:

- Clean up data: remove duplicates, sort lines, trim whitespace, filter empty lines.
- Restructure content: join lines, split by delimiter, wrap at width, add line numbers.
- Transform text: change case, slugify, indent or dedent, add or remove quotes.
- Extract and filter: regex pattern matching, extract matches, keep or remove lines.
- Encode and escape: URL, Base64, HTML entities, JSON escaping, regex escaping.
- Format numbers: add thousands separators, format decimals, increment sequences.

## Features

- Live preview with synchronised scrolling.
- Vim mode via Monaco Editor and monaco-vim.
- 25+ text transformers with custom pipeline support.
- One-click export to Markdown or HTML.
- Dark and light themes with system detection.
- Mobile-optimised tab interface.
- Zero backend; all processing occurs in browser.

## Use Cases

- Documentation: write READMEs, API docs, and wikis with live preview.
- Data cleaning: transform CSVs, logs, and structured text with custom pipelines.
- Note taking: capture thoughts and share via URL without account setup.
- Blogging: draft posts in Markdown and export clean HTML.
- Quick sharing: create temporary documents that do not require storage.

## Technical Stack

- [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/).
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) with [monaco-vim](https://github.com/brijeshb42/monaco-vim) bindings.
- [Tailwind CSS v4](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/) components.
- [Markdown-it](https://github.com/markdown-it/markdown-it) for parsing with [highlight.js](https://highlightjs.org/) for syntax highlighting.
- [LZ-String](https://github.com/pieroxy/lz-string) for URL compression.
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/).

## Development

```bash
npm install
npm run dev        # Start development server
npm run test       # Run unit tests
npm run test:e2e   # Run end-to-end tests
npm run deploy     # Deploy to Cloudflare Workers
```

## Keyboard Shortcuts

| Shortcut               | Action                  |
| ---------------------- | ----------------------- |
| `Cmd/Ctrl + B`         | Bold                    |
| `Cmd/Ctrl + I`         | Italic                  |
| `Cmd/Ctrl + K`         | Link                    |
| `Cmd/Ctrl + E`         | Inline code             |
| `Cmd/Ctrl + Shift + K` | Code block              |
| `Cmd/Ctrl + S`         | Save (persists to URL)  |
| `?`                    | Show keyboard shortcuts |
| `Esc`                  | Close dialogs           |

When Vim mode is enabled: Esc for normal mode, i for insert, v for visual.

## Acknowledgements

Inspired by [Dillinger](https://dillinger.io) and the [TypeScript Playground](https://www.typescriptlang.org/play).

MIT License &copy; 2026 Paul Chiu
