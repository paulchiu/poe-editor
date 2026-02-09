# Poe Editor Proxy

A Cloudflare Worker that generates social media previews when Poe documents are shared. Handles dynamic Open Graph meta tags, preview image generation, and root-level URL routing.

## Overview

When a Poe document is shared on social media, this worker intercepts the request and generates an Open Graph preview. It dynamically injects Open Graph meta tags and renders preview images on-the-fly using Satori and WASM-based rasterization.

### URL Structure

Shared URLs use a clean, root-level format:

```
https://poemd.dev/:title/:snippet#<content-hash>
```

Example: `https://poemd.dev/The-Raven/Once-upon-a-midnight-dreary#abc123...`

### Open Graph Image Endpoint

`/api/og?title=XXX&snippet=YYY` generates 1200x630 PNG preview images with a minimalist dark theme.

## Features

- Dynamic Open Graph meta tag injection via HTMLRewriter for SEO and social sharing.
- On-the-fly preview image generation with a minimalist dark theme.
- Root-level URL routing for clean, shareable links without query parameters.
- Built-in XSS prevention through HTML escaping of all path parameters.

## Technical Stack

- [Satori](https://github.com/vercel/satori) for React-to-SVG conversion.
- [Yoga](https://yogalayout.com/) layout engine (WASM).
- [Resvg](https://github.com/RazrFalcon/resvg) for SVG-to-PNG rasterization (WASM).

## Development

This package is part of a monorepo. Run all commands from the repository root:

```bash
# Install dependencies (from repo root)
npm install

# Start proxy dev server
npm run dev:proxy

# Or start both app and proxy
npm run dev
```

### Package-Specific Commands

If running directly in this package:

```bash
cd packages/proxy

# Start local dev server
npm run dev

# Run tests
npm test              # Watch mode
npm run test:run      # Run once

# Deploy to Cloudflare Workers
npm run deploy
```

## Testing Open Graph Images

The `npm run test:og` script provides an interactive CLI for testing Open Graph image generation during development. Quickly preview, download, and inspect generated preview images:

```bash
# Show help
npm run test:og -- --help

# Preview headers only (fast connectivity check)
npm run test:og -- preview "http://localhost:5173/poe-markdown-editors/my-title"

# Download the Open Graph image to a file
npm run test:og -- download "http://localhost:5173/poe-markdown-editors/my-title"

# Download with custom output filename
npm run test:og -- download "http://localhost:5173/poe-markdown-editors/my-title" -o my-og.png

# Download and automatically open the image
npm run test:og -- open "http://localhost:5173/poe-markdown-editors/my-title"

# Just display parsed URL info (no network request)
npm run test:og -- info "http://localhost:5173/poe-markdown-editors/my-title"

# Use a custom proxy URL
npm run test:og -- preview "http://localhost:5173/poe-markdown-editors/my-title" -p http://localhost:8787
```

Or run the script directly:

```bash
node scripts/og-test.js --help
node scripts/og-test.js preview "http://localhost:5173/poe-markdown-editors/my-title"
```

Available Commands:

- `preview` — Fetch and display response headers (useful for debugging connectivity and headers).
- `download` — Download the generated Open Graph image as PNG to a file.
- `open` — Download and automatically open the image in your default viewer.
- `info` — Display parsed URL information without making network requests.

Features:

- Color-coded output for easy reading (blue for info, green for success, yellow for warnings, red for errors).
- Automatic curl command execution.
- Cross-platform image opening (macOS, Linux, Windows).
- Converts hyphenated URL slugs to proper title case.
- Customizable proxy URL and output filename.

## Deployment

### Automatic (Recommended)

Configure Cloudflare Workers Git Integration:

1. Go to *Cloudflare Dashboard → Workers & Pages*
2. Click *Create Application*
3. Select *"Import a repository"*
4. Connect your GitHub repo
5. Configure:
   - Root Directory: `packages/proxy/`
   - Build Command: (leave empty)
   - Deploy Command: `npx wrangler deploy`

The worker will deploy automatically on every push to main.

⚠️ The Worker name in Cloudflare must match `poe-editor-proxy` (as specified in `wrangler.toml`).

### Manual

```bash
# From repo root
npm run deploy:proxy

# Or from this package directory
npm run deploy
```

## Configuration

The `wrangler.toml` includes a rule for WASM module handling:

```toml
[[rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
fallthrough = false
```

MIT License © 2026 Paul Chiu
