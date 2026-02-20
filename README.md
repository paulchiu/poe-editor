# Poe Markdown Editor

A Markdown editor with live preview, Vim keybindings, and custom text transformation pipelines. Documents persist in the URL, no accounts or storage required.

[Try it now](https://poemd.dev)

## Overview

Poe combines a clean writing interface with tools for text manipulation. It is built for Markdown writers who need more than a basic editor, without the overhead of account management or cloud dependencies.

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
- Vim mode via Monaco Editor and `monaco-vim`.
- 25+ text transformers with custom pipeline support.
- One-click export to Markdown or HTML.
- Dark and light themes with system detection.
- Mobile-optimised tab interface.
- Zero (editor) backend; all processing occurs in browser.
- Markdown table formatting and manipulation tools.
- Mermaid diagram support.
- Static Open Graph image generation via `@packages/og-generator`.
- Cloudflare Workers proxy for meta tag injection.

## Use Cases

- Documentation: write READMEs, API docs, and wikis with live preview.
- Data cleaning: transform CSVs, logs, and structured text with custom pipelines.
- Note taking: capture thoughts and share via URL without account setup.
- Quick sharing: create temporary documents that do not require storage.

## Technical Stack

- [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/).
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) with [monaco-vim](https://github.com/brijeshb42/monaco-vim) bindings.
- [Tailwind CSS v4](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/) components.
- [Markdown-it](https://github.com/markdown-it/markdown-it) for parsing with [highlight.js](https://highlightjs.org/) for syntax highlighting.
- [LZ-String](https://github.com/pieroxy/lz-string) for URL compression.
- Monorepo managed with npm workspaces.
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/) (app) and [Cloudflare Workers](https://workers.cloudflare.com/) (Open Graph proxy).

## Monorepo Structure

```
poe-editor/
├── packages/
│   ├── app/           # React SPA (main editor)
│   ├── og-generator/  # Static OG image generator
│   └── proxy/         # Cloudflare Worker (HTML rewriter & OG meta tag injection)
```

## Development

```bash
# Install dependencies for all workspaces
npm install

# Start both app and proxy concurrently
npm run dev

# Or start them individually
npm run dev:app     # App only (Vite)
npm run dev:proxy   # Proxy only (Wrangler)

# Build the app
npm run build

# Generate static OG images
npm run generate:og

# Run tests
npm test            # Unit tests
npm run test:e2e    # End-to-end tests
```

## Deployment

Both packages deploy automatically via Cloudflare's Git integration:

- App (`packages/app/`): Deploys to Cloudflare Pages on every push to main.
- Proxy (`packages/proxy/`): Deploys to Cloudflare Workers on every push to main.

### Manual Deployment

```bash
# Deploy app manually
npm run deploy:app

# Deploy proxy manually
npm run deploy:proxy
```

## Release Workflow

Automated releases are handled via GitHub Actions when a Pull Request is merged into `main`. The workflow

1.  Checks PR labels for `major`, `minor`, or `patch`.
2.  Bumps the version in `package.json` for all workspaces.
3.  Commits the version bump.
4.  Creates and pushes a new git tag (e.g., `v1.1.0`).

### Requirements

To enable the release workflow to push changes back to the repository, a Deploy Key is required.

1.  Generate an SSH Key
    ```bash
    ssh-keygen -t ed25519 -C "github-actions[bot]" -f gh-deploy-key -N ""
    ```
2.  Add Public Key: Go to Repository Settings > Deploy Keys > Add deploy key.
    - Title: `Release Action`.
    - Key: Paste contents of `gh-deploy-key.pub`.
    - Check "Allow write access" (Critical!).
3.  Add Private Key: Go to Repository Settings > Secrets and variables > Actions > New repository secret.
    - Name: `DEPLOY_KEY`.
    - Secret: Paste contents of `gh-deploy-key`.
4.  Branch Protection: If the `main` branch has protection rules (e.g., requiring Pull Requests), you must allow the Deploy Key to bypass them.
    - In Branch Protection settings for `main`, check "Allow specified actors to bypass required pull requests".
    - Search for and add the Deploy Key (named `Release Action` above). .

## Manual Testing Features

The editor includes several built-in utilities to assist with manual testing and debugging:

- Debug Commands:
  - `/add-all`: Type this in the Transformer Toolbox search bar to add all available operations to the workbench.
- URL Parameters:
  - `?limit=[number]`: Override the default URL length limit (default: 32,000 chars). Useful for testing storage limits.
- UI Testing:
  - Show Splash: Accessed via the Menu (three dots) > Show Splash. Displays the splash screen for debugging.

## Keyboard Shortcuts

Press `?` within the application to view the full list of keyboard shortcuts.

When Vim mode is enabled: Esc for normal mode, i for insert, v for visual.

## Known Limitations

### Vim Mode Clipboard Support

Due to browser security restrictions on the Clipboard API, Vim mode clipboard integration has the following behavior:

- Yank (`y`/`Y`): Copies text to both the internal Vim register and the system clipboard.
- Paste (`p`/`P`): Pastes from the internal Vim register only. This ensures a seamless experience without browser permission popups.
- System Paste: To paste content copied from outside the editor (system clipboard), use the standard native shortcut (Cmd+V on macOS, Ctrl+V on Windows/Linux).

## Acknowledgements

Inspired by [Dillinger](https://dillinger.io) and the [TypeScript Playground](https://www.typescriptlang.org/play).

MIT License © 2026 Paul Chiu
