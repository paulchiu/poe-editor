# Poe Editor Proxy

Cloudflare Worker for dynamic Open Graph previews and root-level routing. Enables rich social media previews when Poe documents are shared.

## Overview

This worker intercepts shareable URLs and injects Open Graph meta tags for social media platforms. It also generates preview images on-the-fly using Satori and WASM-based rasterization.

### URL Structure

Shared URLs use a clean, root-level format:

```
https://poemd.dev/:title/:snippet#<content-hash>
```

Example: `https://poemd.dev/The-Raven/Once-upon-a-midnight-dreary#abc123...`

### OG Image Endpoint

`/api/og?title=XXX&snippet=YYY` generates 1200x630 PNG preview images with a minimalist dark theme.

## Features

- Dynamic OG meta tag injection via HTMLRewriter.
- OG image generation using Satori and SVG-to-PNG rasterization.
- Root-level URL routing for clean shareable links.
- Static asset pass-through without processing overhead.
- XSS prevention through HTML escaping of path parameters.

## Technical Stack

- [Satori](https://github.com/vercel/satori) for React-to-SVG conversion.
- [Yoga](https://yogalayout.com/) layout engine (WASM).
- [Resvg](https://github.com/RazrFalcon/resvg) for SVG-to-PNG rasterization (WASM).

## Development

```bash
npm install        # Install dependencies
npm run dev        # Start local dev server
npm test           # Run tests
npm run test:run   # Run tests once
npm run deploy     # Deploy to Cloudflare Workers
```

## Configuration

The `wrangler.toml` includes a rule for WASM module handling:

```toml
[[rules]]
type = "CompiledWasm"
globs = ["/*.wasm"]
fallthrough = false
```

MIT License &copy; 2026 Paul Chiu
