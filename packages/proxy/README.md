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

## Environment Variables

- `ENVIRONMENT`: Controls the development mode behavior.
  - Development: Set to `"development"` to enable development features.
  - Production: Leave unset or set to anything else.

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

# Start local dev server (uses --env dev)
npm run dev

# Start remote dev server (uses --env dev)
npm run dev:remote

# Run tests
npm test              # Watch mode
npm run test:run      # Run once

# Deploy to Cloudflare Workers
npm run deploy
```

## Configuration

### Automatic (Recommended)

Configure Cloudflare Workers Git Integration:

1. Go to _Cloudflare Dashboard → Workers & Pages_
2. Click _Create Application_
3. Select _"Import a repository"_
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

The `wrangler.toml` enables compiled WASM imports (required for Workers' no-JIT environment):

```toml
compatibility_flags = ["nodejs_compat"]

[[rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
fallthrough = false
```

MIT License © 2026 Paul Chiu
