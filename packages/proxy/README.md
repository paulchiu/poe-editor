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

## Security

To prevent unauthorized usage of the image generation endpoint, all requests to `/api/og` must be signed.

### Environment Variable

- `OG_SECRET`: A secret string used to sign and verify URLs.
  - Production: MUST be set in your Cloudflare Worker environment variables.
  - Development: If not set, defaults to `"development-secret"`. This ensures `wrangler dev` works out of the box.

- `ENVIRONMENT`: Controls the development mode behavior.
  - Development: Set to `"development"` to enable development features like redirecting home page to `og-home.png` and skipping signature checks.
  - Production: Leave unset or set to anything else.

### How it Works

1. When the proxy renders `index.html`, it generates an `og:image` URL containing a `sig` parameter.
2. The `sig` is an HMAC-SHA256 hash of the `title` and `snippet` signed with `OG_SECRET`.
3. When `/api/og` is requested, it verifies the signature. If invalid/missing, it returns `401 Unauthorized`.

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

## Static Asset Sync (R2)

Static assets in `public/` (fonts, splash image) are served by Workers Assets in production, but `wrangler dev --remote` cannot serve local static files. To work around this, assets can be synced to the `poe-editor-static` R2 bucket:

```bash
# Sync to local R2 (for local dev)
npm run asset-sync

# Sync to remote/production R2
npm run asset-sync -- --remote

# Preview what would be uploaded
npm run asset-sync -- --dry-run
```

This is primarily needed for `npm run dev:remote` to function correctly. Standard local dev (`npm run dev`) and production deployments do not require this step.

## Testing Open Graph Images

The `npm run test:og` script (and `scripts/og-test.js`) has been updated to automatically handle signatures using the local development secret.

It provides an interactive CLI for testing Open Graph image generation during development. Quickly preview, download, and inspect generated preview images:

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

### Manual Testing with Curl

If you want to test manually with `curl`, you must generate a signature using `OG_SECRET` (default: `"development-secret"`).

One-liner to generate a signature:

```bash
node -e 'console.log(require("crypto").createHmac("sha256", "development-secret").update(JSON.stringify({title:"Test",snippet:"Hello"})).digest("hex"))'
```

Then append it to your request:

```bash
curl "http://localhost:8787/api/og?title=Test&snippet=Hello&sig=<YOUR_SIGNATURE>"
```

## Deployment

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
   - Environment Variables: Add `OG_SECRET` (encrypt it).

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
