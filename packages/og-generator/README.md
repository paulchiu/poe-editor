# OG Generator

This package generates static Open Graph images for the Poe Editor.

## Usage

From the repository root:

```bash
npm run generate:og
```

Or from this package directory:

```bash
npm run generate
```

This will generate two Open Graph images in `packages/app/public`:

- `og-home.png` (1200x630) - Standard OG image for Facebook, LinkedIn, etc.
- `og-twitter.png` (1200x1200) - Square format optimized for Twitter cards

## Resources

- **Fonts**: Local font files are located in `./fonts`.
- **Assets**: Image assets (like the splash overlay) are in `./assets`.

## Development

The generation logic is in `src/generate.tsx` and the entry point is `src/index.tsx`.
