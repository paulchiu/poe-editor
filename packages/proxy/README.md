# Poe Editor Proxy

Cloudflare Worker for dynamic Open Graph previews and root-level routing.

## Overview

This worker handles:

1. **Root-Level URL Sharing** - URLs like `poemd.dev/:title/:snippet#<hash>`
2. **Dynamic Open Graph Meta Tags** - Injects OG meta tags using HTMLRewriter
3. **OG Image Generation** - Generates 1200x630 PNG images using Satori
4. **Static Asset Pass-Through** - Bypasses processing for static files

## URL Format

Shared URLs follow this structure:

```
https://poemd.dev/:urlEncodedTitle/:urlEncodedSnippet#<content-hash>
```

Example:

```
https://poemd.dev/The-Raven/Once-upon-a-midnight-dreary#abc123...
```

## Architecture

### Routing Logic

The worker intercepts requests **only if**:

- Path has exactly 2 segments (e.g., `/title/snippet`)
- Path does NOT match static assets (excludes `*.js`, `*.css`, `*.png`, etc.)

For matching paths:

1. Parses title/snippet from URL segments
2. Fetches `index.html`
3. Injects OG meta tags using HTMLRewriter
4. Updates `<title>` tag

### OG Image Endpoint

**URL:** `/api/og?title=XXX&snippet=YYY`

**Design:** "Reddit-style" minimalist preview

- Dark gray background (#1a1a1b)
- poemd.dev logo (small, gray)
- Large white serif title
- Medium gray sans-serif snippet (truncated)
- 1200x630 PNG output

**Technology Stack:**

- Satori - React-to-SVG conversion
- Yoga - Layout engine (WASM)
- Resvg - SVG-to-PNG rasterization (WASM)

## Installation

```bash
npm install
```

## Development

```bash
# Start local dev server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run
```

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## Testing

The test suite includes:

1. **Unfurl Check** - Verifies OG meta tags are injected correctly
2. **Pass-Through Check** - Ensures static assets are not modified
3. **Safety Check** - Validates HTML escaping prevents XSS
4. **OG Image Tests** - Confirms PNG generation works
5. **Routing Tests** - Validates path segment handling

Run tests:

```bash
npm test
```

## Project Structure

```
packages/proxy/
├── src/
│   ├── worker.tsx          # Main worker entry point
│   ├── worker.test.tsx     # Test suite
│   └── types/
│       └── wasm.d.ts       # WASM type declarations
├── package.json
├── tsconfig.json
├── vitest.config.ts        # Test configuration
└── wrangler.toml           # Cloudflare configuration
```

## Configuration

### wrangler.toml

```toml
[[rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
fallthrough = false
```

This rule is **critical** for Cloudflare Workers to handle WASM modules correctly.

## Key Dependencies

- `satori@^0.12.2` - OG image generation (locked to v0.12.2 for WASM compatibility)
- `react@^18.3.1` - JSX rendering (locked for satori compatibility)
- `yoga-wasm-web@^0.3.3` - Layout engine
- `@resvg/resvg-wasm@^2.6.2` - PNG rasterization
- `wrangler@^4.63.0` - Cloudflare Workers CLI

## Security Considerations

1. **XSS Prevention** - All path parameters are HTML-escaped before injection
2. **Static Asset Bypass** - Worker never processes asset files (JS, CSS, images)
3. **URL Validation** - Only exactly 2 path segments trigger OG injection
4. **Content Sanitization** - Special characters are URL-encoded then decoded safely

## License

MIT
